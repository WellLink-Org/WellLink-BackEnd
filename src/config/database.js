const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PW,
  port: process.env.POSTGRES_PORT,
});

// ── Table definitions ─────────────────────────────────────────────────────────
// Each data type gets its own table with appropriate columns
const TABLE_DEFINITIONS = {
  steps: `
    CREATE TABLE IF NOT EXISTS steps (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      value           NUMERIC NOT NULL,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  distanceWalkingRunning: `
    CREATE TABLE IF NOT EXISTS distance_walking_running (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      value_meters    NUMERIC,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  distanceCycling: `
    CREATE TABLE IF NOT EXISTS distance_cycling (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      value_meters    NUMERIC,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  distanceSwimming: `
    CREATE TABLE IF NOT EXISTS distance_swimming (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      value_meters    NUMERIC,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  flightsClimbed: `
    CREATE TABLE IF NOT EXISTS flights_climbed (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      value           NUMERIC,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  pushCount: `
    CREATE TABLE IF NOT EXISTS push_count (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      value           NUMERIC,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  swimmingStrokes: `
    CREATE TABLE IF NOT EXISTS swimming_strokes (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      value           NUMERIC,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  activeEnergy: `
    CREATE TABLE IF NOT EXISTS active_energy (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      value_kcal      NUMERIC,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  basalEnergy: `
    CREATE TABLE IF NOT EXISTS basal_energy (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      value_kcal      NUMERIC,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  exerciseMinutes: `
    CREATE TABLE IF NOT EXISTS exercise_minutes (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      value_minutes   NUMERIC,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  standMinutes: `
    CREATE TABLE IF NOT EXISTS stand_minutes (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      value_minutes   NUMERIC,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  heartRate: `
    CREATE TABLE IF NOT EXISTS heart_rate (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      value_bpm       NUMERIC,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  restingHeartRate: `
    CREATE TABLE IF NOT EXISTS resting_heart_rate (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      value_bpm       NUMERIC,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  hrv: `
    CREATE TABLE IF NOT EXISTS hrv (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      value_ms        NUMERIC,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  walkingHeartRate: `
    CREATE TABLE IF NOT EXISTS walking_heart_rate (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      value_bpm       NUMERIC,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  oxygenSaturation: `
    CREATE TABLE IF NOT EXISTS oxygen_saturation (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      value_pct       NUMERIC,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  respiratoryRate: `
    CREATE TABLE IF NOT EXISTS respiratory_rate (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      value_bpm       NUMERIC,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  bodyTemperature: `
    CREATE TABLE IF NOT EXISTS body_temperature (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      value_celsius   NUMERIC,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  bloodGlucose: `
    CREATE TABLE IF NOT EXISTS blood_glucose (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      value_mg_dl     NUMERIC,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  bloodPressureSystolic: `
    CREATE TABLE IF NOT EXISTS blood_pressure_systolic (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      value_mmhg      NUMERIC,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  bloodPressureDiastolic: `
    CREATE TABLE IF NOT EXISTS blood_pressure_diastolic (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      value_mmhg      NUMERIC,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  weight: `
    CREATE TABLE IF NOT EXISTS weight (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      value_kg        NUMERIC,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  bmi: `
    CREATE TABLE IF NOT EXISTS bmi (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      value           NUMERIC,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  bodyFat: `
    CREATE TABLE IF NOT EXISTS body_fat (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      value_pct       NUMERIC,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  height: `
    CREATE TABLE IF NOT EXISTS height (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      value_meters    NUMERIC,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  leanBodyMass: `
    CREATE TABLE IF NOT EXISTS lean_body_mass (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      value_kg        NUMERIC,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  waistCircumference: `
    CREATE TABLE IF NOT EXISTS waist_circumference (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      value_meters    NUMERIC,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  walkingSpeed: `
    CREATE TABLE IF NOT EXISTS walking_speed (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      value_m_s       NUMERIC,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  walkingStepLength: `
    CREATE TABLE IF NOT EXISTS walking_step_length (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      value_meters    NUMERIC,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  walkingAsymmetry: `
    CREATE TABLE IF NOT EXISTS walking_asymmetry (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      value_pct       NUMERIC,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  vo2Max: `
    CREATE TABLE IF NOT EXISTS vo2_max (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      value_ml_kg_min NUMERIC,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  sleep: `
    CREATE TABLE IF NOT EXISTS sleep (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      timestamp_end   TIMESTAMPTZ,
      duration_minutes NUMERIC,
      stage           TEXT,
      value           INT,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  mindfulMinutes: `
    CREATE TABLE IF NOT EXISTS mindful_minutes (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      timestamp_end   TIMESTAMPTZ,
      duration_minutes NUMERIC,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  highHeartRateEvents: `
    CREATE TABLE IF NOT EXISTS high_heart_rate_events (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      timestamp_end   TIMESTAMPTZ,
      value           INT,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  lowHeartRateEvents: `
    CREATE TABLE IF NOT EXISTS low_heart_rate_events (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      timestamp_end   TIMESTAMPTZ,
      value           INT,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  irregularHeartEvents: `
    CREATE TABLE IF NOT EXISTS irregular_heart_events (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      timestamp_end   TIMESTAMPTZ,
      value           INT,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  environmentalAudio: `
    CREATE TABLE IF NOT EXISTS environmental_audio (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      value_db        NUMERIC,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  headphoneAudio: `
    CREATE TABLE IF NOT EXISTS headphone_audio (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      value_db        NUMERIC,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  handwashing: `
    CREATE TABLE IF NOT EXISTS handwashing (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      timestamp_end   TIMESTAMPTZ,
      duration_minutes NUMERIC,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  toothbrushing: `
    CREATE TABLE IF NOT EXISTS toothbrushing (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      timestamp_end   TIMESTAMPTZ,
      duration_minutes NUMERIC,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,

  users: `
  CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    picture TEXT,
    provider TEXT,
    role TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, email, name)
  )`,

  dietaryCalories: dietaryTable("dietary_calories", "value_kcal"),
  dietaryCarbs: dietaryTable("dietary_carbs", "value_grams"),
  dietaryProtein: dietaryTable("dietary_protein", "value_grams"),
  dietaryFat: dietaryTable("dietary_fat", "value_grams"),
  dietaryFiber: dietaryTable("dietary_fiber", "value_grams"),
  dietarySugar: dietaryTable("dietary_sugar", "value_grams"),
  dietarySodium: dietaryTable("dietary_sodium", "value_grams"),
  dietaryWater: dietaryTable("dietary_water", "value_liters"),
  dietaryCaffeine: dietaryTable("dietary_caffeine", "value_grams"),
  dietaryCalcium: dietaryTable("dietary_calcium", "value_grams"),
  dietaryIron: dietaryTable("dietary_iron", "value_grams"),
  dietaryVitaminC: dietaryTable("dietary_vitamin_c", "value_grams"),
  dietaryVitaminD: dietaryTable("dietary_vitamin_d", "value_grams"),

  symptomFatigue: symptomTable("symptom_fatigue"),
  symptomHeadache: symptomTable("symptom_headache"),
  symptomNausea: symptomTable("symptom_nausea"),
  symptomFever: symptomTable("symptom_fever"),
  symptomChills: symptomTable("symptom_chills"),
  symptomCoughing: symptomTable("symptom_coughing"),
  symptomSoreThroat: symptomTable("symptom_sore_throat"),
  symptomShortnessOfBreath: symptomTable("symptom_shortness_of_breath"),
  symptomDizziness: symptomTable("symptom_dizziness"),
  symptomBodyAche: symptomTable("symptom_body_ache"),
  symptomSleepChanges: symptomTable("symptom_sleep_changes"),
  symptomLossOfSmell: symptomTable("symptom_loss_of_smell"),
  symptomLossOfTaste: symptomTable("symptom_loss_of_taste"),

  menstrualFlow: reproTable("menstrual_flow"),
  ovulationTest: reproTable("ovulation_test"),
  cervicalMucus: reproTable("cervical_mucus"),
  sexualActivity: reproTable("sexual_activity"),
  pregnancy: reproTable("pregnancy"),
  lactation: reproTable("lactation"),

  workouts: `
    CREATE TABLE IF NOT EXISTS workouts (
      id               SERIAL PRIMARY KEY,
      user_id          TEXT NOT NULL,
      recorded_date    DATE NOT NULL,
      timestamp_start  TIMESTAMPTZ NOT NULL,
      timestamp_end    TIMESTAMPTZ,
      type             TEXT,
      duration_minutes NUMERIC,
      calories_kcal    NUMERIC,
      distance_km      NUMERIC,
      source           TEXT,
      created_at       TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`,
};

// ── Template helpers ──────────────────────────────────────────────────────────
function dietaryTable(tableName, valueCol) {
  return `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      ${valueCol}     NUMERIC,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`;
}

function symptomTable(tableName) {
  return `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      timestamp_end   TIMESTAMPTZ,
      severity        INT,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`;
}

function reproTable(tableName) {
  return `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recorded_date   DATE NOT NULL,
      timestamp_start TIMESTAMPTZ NOT NULL,
      timestamp_end   TIMESTAMPTZ,
      value           INT,
      source          TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, timestamp_start, source)
    )`;
}

// ── Map dataType key → actual SQL table name ──────────────────────────────────
const TABLE_NAMES = {
  steps: "steps",
  distanceWalkingRunning: "distance_walking_running",
  distanceCycling: "distance_cycling",
  distanceSwimming: "distance_swimming",
  flightsClimbed: "flights_climbed",
  pushCount: "push_count",
  swimmingStrokes: "swimming_strokes",
  activeEnergy: "active_energy",
  basalEnergy: "basal_energy",
  exerciseMinutes: "exercise_minutes",
  standMinutes: "stand_minutes",
  heartRate: "heart_rate",
  restingHeartRate: "resting_heart_rate",
  hrv: "hrv",
  walkingHeartRate: "walking_heart_rate",
  oxygenSaturation: "oxygen_saturation",
  respiratoryRate: "respiratory_rate",
  bodyTemperature: "body_temperature",
  bloodGlucose: "blood_glucose",
  bloodPressureSystolic: "blood_pressure_systolic",
  bloodPressureDiastolic: "blood_pressure_diastolic",
  weight: "weight",
  bmi: "bmi",
  bodyFat: "body_fat",
  height: "height",
  leanBodyMass: "lean_body_mass",
  waistCircumference: "waist_circumference",
  walkingSpeed: "walking_speed",
  walkingStepLength: "walking_step_length",
  walkingAsymmetry: "walking_asymmetry",
  vo2Max: "vo2_max",
  sleep: "sleep",
  mindfulMinutes: "mindful_minutes",
  highHeartRateEvents: "high_heart_rate_events",
  lowHeartRateEvents: "low_heart_rate_events",
  irregularHeartEvents: "irregular_heart_events",
  environmentalAudio: "environmental_audio",
  headphoneAudio: "headphone_audio",
  handwashing: "handwashing",
  toothbrushing: "toothbrushing",
  dietaryCalories: "dietary_calories",
  dietaryCarbs: "dietary_carbs",
  dietaryProtein: "dietary_protein",
  dietaryFat: "dietary_fat",
  dietaryFiber: "dietary_fiber",
  dietarySugar: "dietary_sugar",
  dietarySodium: "dietary_sodium",
  dietaryWater: "dietary_water",
  dietaryCaffeine: "dietary_caffeine",
  dietaryCalcium: "dietary_calcium",
  dietaryIron: "dietary_iron",
  dietaryVitaminC: "dietary_vitamin_c",
  dietaryVitaminD: "dietary_vitamin_d",
  symptomFatigue: "symptom_fatigue",
  symptomHeadache: "symptom_headache",
  symptomNausea: "symptom_nausea",
  symptomFever: "symptom_fever",
  symptomChills: "symptom_chills",
  symptomCoughing: "symptom_coughing",
  symptomSoreThroat: "symptom_sore_throat",
  symptomShortnessOfBreath: "symptom_shortness_of_breath",
  symptomDizziness: "symptom_dizziness",
  symptomBodyAche: "symptom_body_ache",
  symptomSleepChanges: "symptom_sleep_changes",
  symptomLossOfSmell: "symptom_loss_of_smell",
  symptomLossOfTaste: "symptom_loss_of_taste",
  menstrualFlow: "menstrual_flow",
  ovulationTest: "ovulation_test",
  cervicalMucus: "cervical_mucus",
  sexualActivity: "sexual_activity",
  pregnancy: "pregnancy",
  lactation: "lactation",
  workouts: "workouts",
};

// ── Per-table insert logic ────────────────────────────────────────────────────
// Returns { sql, values } for each dataType row
function buildInsert(dataType, userId, row) {
  const tsRaw = row.timestamp || row.start || row.date || null;
  const tsStart = tsRaw ? new Date(tsRaw) : null;
  const tsEnd = row.end ? new Date(row.end) : null;
  const date = tsStart ? tsStart.toISOString().substring(0, 10) : null;
  const source = row.source || null;
  const val = row.value ?? null;
  const table = TABLE_NAMES[dataType];

  // Simple quantity types (single value column)
  const simpleTypes = {
    steps: [
      "steps",
      `(user_id,recorded_date,timestamp_start,value,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    distanceWalkingRunning: [
      "distance_walking_running",
      `(user_id,recorded_date,timestamp_start,value_meters,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    distanceCycling: [
      "distance_cycling",
      `(user_id,recorded_date,timestamp_start,value_meters,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    distanceSwimming: [
      "distance_swimming",
      `(user_id,recorded_date,timestamp_start,value_meters,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    flightsClimbed: [
      "flights_climbed",
      `(user_id,recorded_date,timestamp_start,value,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    pushCount: [
      "push_count",
      `(user_id,recorded_date,timestamp_start,value,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    swimmingStrokes: [
      "swimming_strokes",
      `(user_id,recorded_date,timestamp_start,value,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    activeEnergy: [
      "active_energy",
      `(user_id,recorded_date,timestamp_start,value_kcal,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    basalEnergy: [
      "basal_energy",
      `(user_id,recorded_date,timestamp_start,value_kcal,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    exerciseMinutes: [
      "exercise_minutes",
      `(user_id,recorded_date,timestamp_start,value_minutes,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    standMinutes: [
      "stand_minutes",
      `(user_id,recorded_date,timestamp_start,value_minutes,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    heartRate: [
      "heart_rate",
      `(user_id,recorded_date,timestamp_start,value_bpm,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    restingHeartRate: [
      "resting_heart_rate",
      `(user_id,recorded_date,timestamp_start,value_bpm,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    hrv: [
      "hrv",
      `(user_id,recorded_date,timestamp_start,value_ms,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    walkingHeartRate: [
      "walking_heart_rate",
      `(user_id,recorded_date,timestamp_start,value_bpm,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    oxygenSaturation: [
      "oxygen_saturation",
      `(user_id,recorded_date,timestamp_start,value_pct,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    respiratoryRate: [
      "respiratory_rate",
      `(user_id,recorded_date,timestamp_start,value_bpm,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    bodyTemperature: [
      "body_temperature",
      `(user_id,recorded_date,timestamp_start,value_celsius,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    bloodGlucose: [
      "blood_glucose",
      `(user_id,recorded_date,timestamp_start,value_mg_dl,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    bloodPressureSystolic: [
      "blood_pressure_systolic",
      `(user_id,recorded_date,timestamp_start,value_mmhg,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    bloodPressureDiastolic: [
      "blood_pressure_diastolic",
      `(user_id,recorded_date,timestamp_start,value_mmhg,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    weight: [
      "weight",
      `(user_id,recorded_date,timestamp_start,value_kg,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    bmi: [
      "bmi",
      `(user_id,recorded_date,timestamp_start,value,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    bodyFat: [
      "body_fat",
      `(user_id,recorded_date,timestamp_start,value_pct,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    height: [
      "height",
      `(user_id,recorded_date,timestamp_start,value_meters,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    leanBodyMass: [
      "lean_body_mass",
      `(user_id,recorded_date,timestamp_start,value_kg,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    waistCircumference: [
      "waist_circumference",
      `(user_id,recorded_date,timestamp_start,value_meters,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    walkingSpeed: [
      "walking_speed",
      `(user_id,recorded_date,timestamp_start,value_m_s,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    walkingStepLength: [
      "walking_step_length",
      `(user_id,recorded_date,timestamp_start,value_meters,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    walkingAsymmetry: [
      "walking_asymmetry",
      `(user_id,recorded_date,timestamp_start,value_pct,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    vo2Max: [
      "vo2_max",
      `(user_id,recorded_date,timestamp_start,value_ml_kg_min,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    environmentalAudio: [
      "environmental_audio",
      `(user_id,recorded_date,timestamp_start,value_db,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    headphoneAudio: [
      "headphone_audio",
      `(user_id,recorded_date,timestamp_start,value_db,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    dietaryCalories: [
      "dietary_calories",
      `(user_id,recorded_date,timestamp_start,value_kcal,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    dietaryCarbs: [
      "dietary_carbs",
      `(user_id,recorded_date,timestamp_start,value_grams,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    dietaryProtein: [
      "dietary_protein",
      `(user_id,recorded_date,timestamp_start,value_grams,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    dietaryFat: [
      "dietary_fat",
      `(user_id,recorded_date,timestamp_start,value_grams,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    dietaryFiber: [
      "dietary_fiber",
      `(user_id,recorded_date,timestamp_start,value_grams,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    dietarySugar: [
      "dietary_sugar",
      `(user_id,recorded_date,timestamp_start,value_grams,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    dietarySodium: [
      "dietary_sodium",
      `(user_id,recorded_date,timestamp_start,value_grams,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    dietaryWater: [
      "dietary_water",
      `(user_id,recorded_date,timestamp_start,value_liters,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    dietaryCaffeine: [
      "dietary_caffeine",
      `(user_id,recorded_date,timestamp_start,value_grams,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    dietaryCalcium: [
      "dietary_calcium",
      `(user_id,recorded_date,timestamp_start,value_grams,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    dietaryIron: [
      "dietary_iron",
      `(user_id,recorded_date,timestamp_start,value_grams,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    dietaryVitaminC: [
      "dietary_vitamin_c",
      `(user_id,recorded_date,timestamp_start,value_grams,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
    dietaryVitaminD: [
      "dietary_vitamin_d",
      `(user_id,recorded_date,timestamp_start,value_grams,source) VALUES($1,$2,$3,$4,$5)`,
      [userId, date, tsStart, val, source],
    ],
  };

  if (simpleTypes[dataType]) {
    const [tbl, cols, vals] = simpleTypes[dataType];
    return {
      sql: `INSERT INTO ${tbl} ${cols} ON CONFLICT (user_id,timestamp_start,source) DO NOTHING`,
      values: vals,
    };
  }

  // Sleep
  if (dataType === "sleep") {
    const stageMap = {
      0: "in_bed",
      1: "asleep",
      2: "awake",
      3: "core",
      4: "deep",
      5: "rem",
    };
    return {
      sql: `INSERT INTO sleep (user_id,recorded_date,timestamp_start,timestamp_end,duration_minutes,stage,value,source)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
            ON CONFLICT (user_id,timestamp_start,source) DO NOTHING`,
      values: [
        userId,
        date,
        tsStart,
        tsEnd,
        row.durationMinutes ?? null,
        stageMap[row.value] ?? row.stage ?? null,
        row.value ?? null,
        source,
      ],
    };
  }

  // Interval types (start + end + duration)
  const intervalTypes = [
    "mindfulMinutes",
    "handwashing",
    "toothbrushing",
    "highHeartRateEvents",
    "lowHeartRateEvents",
    "irregularHeartEvents",
  ];
  if (intervalTypes.includes(dataType)) {
    return {
      sql: `INSERT INTO ${table} (user_id,recorded_date,timestamp_start,timestamp_end,duration_minutes,source)
            VALUES ($1,$2,$3,$4,$5,$6)
            ON CONFLICT (user_id,timestamp_start,source) DO NOTHING`,
      values: [
        userId,
        date,
        tsStart,
        tsEnd,
        row.durationMinutes ?? null,
        source,
      ],
    };
  }

  // Symptom types
  const symptomTypes = [
    "symptomFatigue",
    "symptomHeadache",
    "symptomNausea",
    "symptomFever",
    "symptomChills",
    "symptomCoughing",
    "symptomSoreThroat",
    "symptomShortnessOfBreath",
    "symptomDizziness",
    "symptomBodyAche",
    "symptomSleepChanges",
    "symptomLossOfSmell",
    "symptomLossOfTaste",
  ];
  if (symptomTypes.includes(dataType)) {
    return {
      sql: `INSERT INTO ${table} (user_id,recorded_date,timestamp_start,timestamp_end,severity,source)
            VALUES ($1,$2,$3,$4,$5,$6)
            ON CONFLICT (user_id,timestamp_start,source) DO NOTHING`,
      values: [userId, date, tsStart, tsEnd, row.value ?? null, source],
    };
  }

  // Reproductive types
  const reproTypes = [
    "menstrualFlow",
    "ovulationTest",
    "cervicalMucus",
    "sexualActivity",
    "pregnancy",
    "lactation",
  ];
  if (reproTypes.includes(dataType)) {
    return {
      sql: `INSERT INTO ${table} (user_id,recorded_date,timestamp_start,timestamp_end,value,source)
            VALUES ($1,$2,$3,$4,$5,$6)
            ON CONFLICT (user_id,timestamp_start,source) DO NOTHING`,
      values: [userId, date, tsStart, tsEnd, row.value ?? null, source],
    };
  }

  // Workouts
  if (dataType === "workouts") {
    return {
      sql: `INSERT INTO workouts (user_id,recorded_date,timestamp_start,timestamp_end,type,duration_minutes,calories_kcal,distance_km,source)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
            ON CONFLICT (user_id,timestamp_start,source) DO NOTHING`,
      values: [
        userId,
        date,
        tsStart,
        tsEnd,
        row.type ?? null,
        row.durationMinutes ?? null,
        row.calories ?? null,
        row.distanceKm ?? null,
        source,
      ],
    };
  }

  return null;
}

// ── Load from individual tables ───────────────────────────────────────────────
async function loadFromTable(dataType, userId) {
  const table = TABLE_NAMES[dataType];
  if (!table) return [];
  try {
    const { rows } = await pool.query(
      `SELECT * FROM ${table} WHERE user_id = $1 ORDER BY timestamp_start`,
      [userId],
    );
    return rows;
  } catch {
    return [];
  }
}

async function initDB() {
  // Run all CREATE TABLE statements
  for (const sql of Object.values(TABLE_DEFINITIONS)) {
    await pool.query(sql);
  }
  console.log(`${Object.keys(TABLE_DEFINITIONS).length} tables ready`);
}

module.exports = {
  pool,
  initDB,
  buildInsert,
  loadFromTable,
  TABLE_NAMES,
};
