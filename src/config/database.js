const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PW,
  port: process.env.POSTGRES_PORT,
});

const TABLE_DEFINITIONS = {
  users: `
    CREATE TABLE IF NOT EXISTS users (
      user_id       TEXT PRIMARY KEY,
      email         TEXT NOT NULL,
      name          TEXT NOT NULL,
      picture       TEXT,
      provider      TEXT,
      role          TEXT,
      role_updated  BOOLEAN,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, email, name)
    )`,

  // Single unified table replaces all ~60 per-type tables.
  // - type:     the HealthKit identifier, e.g. 'heart_rate', 'steps', 'sleep'
  // - category: grouping for queries — 'quantity', 'category', 'workout',
  //             'symptom', 'dietary', 'reproductive', 'sleep', 'interval'
  // - value:    primary numeric value (bpm, steps, kg, kcal, severity …)
  // - value2:   optional second value (diastolic alongside systolic, etc.)
  // - unit:     the unit string — 'bpm', 'count', 'kg', 'kcal', 'pct', 'ms' …
  // - stage:    sleep stage when category = 'sleep'
  // - metadata: anything that doesn't fit above (workout type, dip-tube flag…)
  health_samples: `
    CREATE TABLE IF NOT EXISTS health_samples (
      id             BIGSERIAL PRIMARY KEY,
      user_id        TEXT        NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      type           TEXT        NOT NULL,
      category       TEXT        NOT NULL,
      recorded_date  DATE        NOT NULL,
      sampled_at     TIMESTAMPTZ NOT NULL,
      ended_at       TIMESTAMPTZ,
      value          NUMERIC,
      value2         NUMERIC,
      unit           TEXT,
      stage          TEXT,
      source         TEXT,
      metadata       JSONB,
      created_at     TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, type, sampled_at, source)
    )`,

  // Workouts stay separate — they have a fundamentally different shape
  // (duration, distance, route segments, heart-rate zones …)
  workouts: `
    CREATE TABLE IF NOT EXISTS workouts (
      id               BIGSERIAL PRIMARY KEY,
      user_id          TEXT        NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      recorded_date    DATE        NOT NULL,
      started_at       TIMESTAMPTZ NOT NULL,
      ended_at         TIMESTAMPTZ,
      type             TEXT,
      duration_minutes NUMERIC,
      calories_kcal    NUMERIC,
      distance_km      NUMERIC,
      source           TEXT,
      metadata         JSONB,
      created_at       TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, started_at, source)
    )`,

  sharing_grants: `
    CREATE TABLE IF NOT EXISTS sharing_grants (
      id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id         TEXT        NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      recipient_id     TEXT        NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      data_scope       TEXT        NOT NULL DEFAULT 'all',
      permission_level TEXT        NOT NULL DEFAULT 'read',
      expires_at       TIMESTAMPTZ,
      created_at       TIMESTAMPTZ DEFAULT NOW()
    )`,

  user_networks: `
    CREATE TABLE IF NOT EXISTS user_networks (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id      TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      contact_id   TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      role         TEXT NOT NULL,
      status       TEXT NOT NULL DEFAULT 'pending',
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, contact_id)
    )`,

  dashboards: `
    CREATE TABLE IF NOT EXISTS dashboards (
      id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id    TEXT    NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      name       TEXT    NOT NULL,
      is_default BOOLEAN NOT NULL DEFAULT FALSE,
      layout     JSONB,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,

  dashboard_widgets: `
    CREATE TABLE IF NOT EXISTS dashboard_widgets (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
      widget_type  TEXT NOT NULL,
      data_type    TEXT NOT NULL,
      config       JSONB,
      position_x   INT  NOT NULL DEFAULT 0,
      position_y   INT  NOT NULL DEFAULT 0,
      width        INT  NOT NULL DEFAULT 1,
      height       INT  NOT NULL DEFAULT 1,
      size_variant TEXT
    )`,

  feedback_threads: `
    CREATE TABLE IF NOT EXISTS feedback_threads (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      doctor_id  TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      status     TEXT NOT NULL DEFAULT 'open',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,

  feedback_messages: `
    CREATE TABLE IF NOT EXISTS feedback_messages (
      id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      thread_id         UUID        NOT NULL REFERENCES feedback_threads(id) ON DELETE CASCADE,
      sender_id         TEXT        NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      content           TEXT,
      attached_snapshot JSONB,
      sent_at           TIMESTAMPTZ DEFAULT NOW()
    )`,

  ai_insights: `
    CREATE TABLE IF NOT EXISTS ai_insights (
      id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id      TEXT        NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      insight_type TEXT        NOT NULL,
      content      TEXT,
      context      JSONB,
      generated_at TIMESTAMPTZ DEFAULT NOW(),
      dismissed    BOOLEAN     NOT NULL DEFAULT FALSE
    )`,
};

const INDEXES = [
  // Most common query: a user's samples of a specific type in a time range
  `CREATE INDEX IF NOT EXISTS idx_health_samples_user_type_time
     ON health_samples (user_id, type, sampled_at DESC)`,

  // Dashboard / overview: all samples for a user in a date range
  `CREATE INDEX IF NOT EXISTS idx_health_samples_user_time
     ON health_samples (user_id, sampled_at DESC)`,

  // Doctor lookup: quickly find active grants for a recipient
  `CREATE INDEX IF NOT EXISTS idx_sharing_grants_recipient
     ON sharing_grants (recipient_id, owner_id)`,

  `CREATE INDEX IF NOT EXISTS idx_workouts_user_time
     ON workouts (user_id, started_at DESC)`,

  `CREATE INDEX IF NOT EXISTS idx_ai_insights_user
     ON ai_insights (user_id, generated_at DESC)`,
];

const TYPE_META = {
  // Activity
  steps: { category: "quantity", unit: "count" },
  distanceWalkingRunning: { category: "quantity", unit: "meters" },
  distanceCycling: { category: "quantity", unit: "meters" },
  distanceSwimming: { category: "quantity", unit: "meters" },
  flightsClimbed: { category: "quantity", unit: "count" },
  pushCount: { category: "quantity", unit: "count" },
  swimmingStrokes: { category: "quantity", unit: "count" },
  activeEnergy: { category: "quantity", unit: "kcal" },
  basalEnergy: { category: "quantity", unit: "kcal" },
  exerciseMinutes: { category: "quantity", unit: "minutes" },
  standMinutes: { category: "quantity", unit: "minutes" },
  // Heart
  heartRate: { category: "quantity", unit: "bpm" },
  restingHeartRate: { category: "quantity", unit: "bpm" },
  hrv: { category: "quantity", unit: "ms" },
  walkingHeartRate: { category: "quantity", unit: "bpm" },
  highHeartRateEvents: { category: "interval", unit: null },
  lowHeartRateEvents: { category: "interval", unit: null },
  irregularHeartEvents: { category: "interval", unit: null },
  // Vitals
  oxygenSaturation: { category: "quantity", unit: "pct" },
  respiratoryRate: { category: "quantity", unit: "bpm" },
  bodyTemperature: { category: "quantity", unit: "celsius" },
  bloodGlucose: { category: "quantity", unit: "mg_dl" },
  bloodPressureSystolic: { category: "quantity", unit: "mmhg" },
  bloodPressureDiastolic: { category: "quantity", unit: "mmhg" },
  // Body measurements
  weight: { category: "quantity", unit: "kg" },
  bmi: { category: "quantity", unit: null },
  bodyFat: { category: "quantity", unit: "pct" },
  height: { category: "quantity", unit: "meters" },
  leanBodyMass: { category: "quantity", unit: "kg" },
  waistCircumference: { category: "quantity", unit: "meters" },
  // Mobility
  walkingSpeed: { category: "quantity", unit: "m_s" },
  walkingStepLength: { category: "quantity", unit: "meters" },
  walkingAsymmetry: { category: "quantity", unit: "pct" },
  vo2Max: { category: "quantity", unit: "ml_kg_min" },
  // Sleep / mindfulness
  sleep: { category: "sleep", unit: null },
  mindfulMinutes: { category: "interval", unit: "minutes" },
  // Environment
  environmentalAudio: { category: "quantity", unit: "db" },
  headphoneAudio: { category: "quantity", unit: "db" },
  // Hygiene
  handwashing: { category: "interval", unit: "minutes" },
  toothbrushing: { category: "interval", unit: "minutes" },
  // Dietary
  dietaryCalories: { category: "dietary", unit: "kcal" },
  dietaryCarbs: { category: "dietary", unit: "grams" },
  dietaryProtein: { category: "dietary", unit: "grams" },
  dietaryFat: { category: "dietary", unit: "grams" },
  dietaryFiber: { category: "dietary", unit: "grams" },
  dietarySugar: { category: "dietary", unit: "grams" },
  dietarySodium: { category: "dietary", unit: "grams" },
  dietaryWater: { category: "dietary", unit: "liters" },
  dietaryCaffeine: { category: "dietary", unit: "grams" },
  dietaryCalcium: { category: "dietary", unit: "grams" },
  dietaryIron: { category: "dietary", unit: "grams" },
  dietaryVitaminC: { category: "dietary", unit: "grams" },
  dietaryVitaminD: { category: "dietary", unit: "grams" },
  // Symptoms
  symptomFatigue: { category: "symptom", unit: null },
  symptomHeadache: { category: "symptom", unit: null },
  symptomNausea: { category: "symptom", unit: null },
  symptomFever: { category: "symptom", unit: null },
  symptomChills: { category: "symptom", unit: null },
  symptomCoughing: { category: "symptom", unit: null },
  symptomSoreThroat: { category: "symptom", unit: null },
  symptomShortnessOfBreath: { category: "symptom", unit: null },
  symptomDizziness: { category: "symptom", unit: null },
  symptomBodyAche: { category: "symptom", unit: null },
  symptomSleepChanges: { category: "symptom", unit: null },
  symptomLossOfSmell: { category: "symptom", unit: null },
  symptomLossOfTaste: { category: "symptom", unit: null },
  // Reproductive
  menstrualFlow: { category: "reproductive", unit: null },
  ovulationTest: { category: "reproductive", unit: null },
  cervicalMucus: { category: "reproductive", unit: null },
  sexualActivity: { category: "reproductive", unit: null },
  pregnancy: { category: "reproductive", unit: null },
  lactation: { category: "reproductive", unit: null },
};

function toTypeName(dataType) {
  return dataType
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "");
}

function buildInsert(dataType, userId, row) {
  // Workouts stay in their own table — delegate to old-style insert
  if (dataType === "workouts") {
    const tsStart =
      row.timestamp || row.start || row.date
        ? new Date(row.timestamp || row.start || row.date)
        : null;
    const tsEnd = row.end ? new Date(row.end) : null;
    const date = tsStart ? tsStart.toISOString().substring(0, 10) : null;
    return {
      sql: `INSERT INTO workouts
              (user_id, recorded_date, started_at, ended_at, type,
               duration_minutes, calories_kcal, distance_km, source)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
            ON CONFLICT (user_id, started_at, source) DO NOTHING`,
      values: [
        userId,
        date,
        tsStart,
        tsEnd,
        row.type ?? null,
        row.durationMinutes ?? null,
        row.calories ?? null,
        row.distanceKm ?? null,
        row.source ?? null,
      ],
    };
  }

  const meta = TYPE_META[dataType];
  if (!meta) return null; // unknown type — silently skip

  const tsRaw = row.timestamp || row.start || row.date || null;
  const tsStart = tsRaw ? new Date(tsRaw) : null;
  const tsEnd = row.end ? new Date(row.end) : null;
  const date = tsStart ? tsStart.toISOString().substring(0, 10) : null;
  const source = row.source ?? null;
  const typeName = toTypeName(dataType);

  // Sleep: store stage in its own column, raw value int as value
  const SLEEP_STAGE = {
    0: "in_bed",
    1: "asleep",
    2: "awake",
    3: "core",
    4: "deep",
    5: "rem",
  };

  let value = row.value ?? null;
  let value2 = null;
  let stage = null;

  if (meta.category === "sleep") {
    stage = SLEEP_STAGE[row.value] ?? row.stage ?? null;
  }

  // Symptom severity lives in row.value — already captured above.
  // Interval types have duration stored in row.durationMinutes — keep value as-is.

  const metadata = {};
  if (row.durationMinutes != null)
    metadata.duration_minutes = row.durationMinutes;
  if (Object.keys(metadata).length === 0) Object.assign(metadata, null); // don't store {}

  return {
    sql: `INSERT INTO health_samples
            (user_id, type, category, recorded_date, sampled_at, ended_at,
             value, value2, unit, stage, source, metadata)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
          ON CONFLICT (user_id, type, sampled_at, source) DO NOTHING`,
    values: [
      userId,
      typeName,
      meta.category,
      date,
      tsStart,
      tsEnd,
      value,
      value2,
      meta.unit,
      stage,
      source,
      Object.keys(metadata || {}).length ? metadata : null,
    ],
  };
}

async function loadFromTable(dataType, userId) {
  if (dataType === "workouts") {
    try {
      const { rows } = await pool.query(
        `SELECT * FROM workouts WHERE user_id = $1 ORDER BY started_at`,
        [userId],
      );
      return rows;
    } catch {
      return [];
    }
  }

  const meta = TYPE_META[dataType];
  if (!meta) return [];

  try {
    const { rows } = await pool.query(
      `SELECT * FROM health_samples
       WHERE user_id = $1 AND type = $2
       ORDER BY sampled_at`,
      [userId, toTypeName(dataType)],
    );
    return rows;
  } catch {
    return [];
  }
}

async function initDB() {
  const ordered = [
    "users",
    "health_samples",
    "workouts",
    "sharing_grants",
    "user_networks",
    "dashboards",
    "dashboard_widgets",
    "feedback_threads",
    "feedback_messages",
    "ai_insights",
  ];

  for (const key of ordered) {
    await pool.query(TABLE_DEFINITIONS[key]);
  }

  for (const sql of INDEXES) {
    await pool.query(sql);
  }

  console.log(`DB ready — ${ordered.length} tables, ${INDEXES.length} indexes`);
}

const TABLE_NAMES = new Proxy(
  {},
  {
    get(_, key) {
      if (key === "workouts") return "workouts";
      if (TYPE_META[key]) return "health_samples";
      return undefined;
    },
  },
);

module.exports = {
  pool,
  initDB,
  buildInsert,
  loadFromTable,
  TABLE_NAMES,
  TYPE_META,
  toTypeName,
};
