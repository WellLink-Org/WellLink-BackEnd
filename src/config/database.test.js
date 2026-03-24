/**
 * Unit tests for db.js
 *
 * Run with: npx jest db.test.js
 * Dependencies: jest, pg (mocked)
 */

// ── Mock pg before importing db ───────────────────────────────────────────────
const mockQuery = jest.fn();
const mockPool = { query: mockQuery };

jest.mock("pg", () => ({
  Pool: jest.fn(() => mockPool),
}));

// Now import the module under test
const {
  buildInsert,
  loadFromTable,
  TABLE_NAMES,
  createUser,
  updateUserRole,
  initDB,
} = require("./database");

// ── Helpers ───────────────────────────────────────────────────────────────────
beforeEach(() => {
  mockQuery.mockReset();
});

// ─────────────────────────────────────────────────────────────────────────────
// buildInsert
// ─────────────────────────────────────────────────────────────────────────────
describe("buildInsert", () => {
  const userId = "user_123";

  // ── Simple quantity types ─────────────────────────────────────────────────
  describe("simple quantity types", () => {
    const simpleFixtures = [
      { dataType: "steps", table: "steps", valueCol: 3 },
      {
        dataType: "distanceWalkingRunning",
        table: "distance_walking_running",
        valueCol: 3,
      },
      { dataType: "distanceCycling", table: "distance_cycling", valueCol: 3 },
      { dataType: "distanceSwimming", table: "distance_swimming", valueCol: 3 },
      { dataType: "flightsClimbed", table: "flights_climbed", valueCol: 3 },
      { dataType: "activeEnergy", table: "active_energy", valueCol: 3 },
      { dataType: "basalEnergy", table: "basal_energy", valueCol: 3 },
      { dataType: "heartRate", table: "heart_rate", valueCol: 3 },
      {
        dataType: "restingHeartRate",
        table: "resting_heart_rate",
        valueCol: 3,
      },
      { dataType: "hrv", table: "hrv", valueCol: 3 },
      { dataType: "weight", table: "weight", valueCol: 3 },
      { dataType: "bmi", table: "bmi", valueCol: 3 },
      { dataType: "vo2Max", table: "vo2_max", valueCol: 3 },
      { dataType: "dietaryCalories", table: "dietary_calories", valueCol: 3 },
      { dataType: "dietaryCarbs", table: "dietary_carbs", valueCol: 3 },
    ];

    test.each(simpleFixtures)(
      "$dataType → INSERT INTO $table with correct values",
      ({ dataType, table }) => {
        const row = {
          timestamp: "2024-01-15T08:00:00Z",
          value: 42,
          source: "iPhone",
        };
        const result = buildInsert(dataType, userId, row);

        expect(result).not.toBeNull();
        expect(result.sql).toMatch(new RegExp(`INSERT INTO ${table}`, "i"));
        expect(result.sql).toMatch(/ON CONFLICT.*DO NOTHING/i);

        // values: [userId, date, tsStart, val, source]
        expect(result.values[0]).toBe(userId);
        expect(result.values[1]).toBe("2024-01-15");
        expect(result.values[2]).toEqual(new Date("2024-01-15T08:00:00Z"));
        expect(result.values[3]).toBe(42);
        expect(result.values[4]).toBe("iPhone");
      },
    );

    test("uses row.start when row.timestamp is absent", () => {
      const row = { start: "2024-03-10T12:00:00Z", value: 500 };
      const result = buildInsert("steps", userId, row);
      expect(result.values[2]).toEqual(new Date("2024-03-10T12:00:00Z"));
    });

    test("uses row.date when row.timestamp and row.start are absent", () => {
      const row = { date: "2024-03-10T12:00:00Z", value: 500 };
      const result = buildInsert("steps", userId, row);
      expect(result.values[2]).toEqual(new Date("2024-03-10T12:00:00Z"));
    });

    test("null source when source is absent", () => {
      const row = { timestamp: "2024-01-01T00:00:00Z", value: 10 };
      const result = buildInsert("steps", userId, row);
      expect(result.values[4]).toBeNull();
    });

    test("null value when value is absent", () => {
      const row = { timestamp: "2024-01-01T00:00:00Z" };
      const result = buildInsert("steps", userId, row);
      expect(result.values[3]).toBeNull();
    });
  });

  // ── Sleep ────────────────────────────────────────────────────────────────
  describe("sleep", () => {
    const row = {
      timestamp: "2024-01-15T22:00:00Z",
      end: "2024-01-16T06:00:00Z",
      value: 4,
      durationMinutes: 480,
      source: "Apple Watch",
    };

    test("inserts into sleep table", () => {
      const result = buildInsert("sleep", userId, row);
      expect(result.sql).toMatch(/INSERT INTO sleep/i);
    });

    test("maps numeric value 4 → 'deep'", () => {
      const result = buildInsert("sleep", userId, row);
      // values: [userId, date, tsStart, tsEnd, durationMinutes, stage, value, source]
      expect(result.values[5]).toBe("deep");
      expect(result.values[6]).toBe(4);
    });

    test("maps value 0 → 'in_bed'", () => {
      const result = buildInsert("sleep", userId, { ...row, value: 0 });
      expect(result.values[5]).toBe("in_bed");
    });

    test("maps value 5 → 'rem'", () => {
      const result = buildInsert("sleep", userId, { ...row, value: 5 });
      expect(result.values[5]).toBe("rem");
    });

    test("uses row.stage as fallback for unknown value", () => {
      const result = buildInsert("sleep", userId, {
        ...row,
        value: 99,
        stage: "custom",
      });
      expect(result.values[5]).toBe("custom");
    });

    test("includes tsEnd and durationMinutes", () => {
      const result = buildInsert("sleep", userId, row);
      expect(result.values[3]).toEqual(new Date("2024-01-16T06:00:00Z"));
      expect(result.values[4]).toBe(480);
    });

    test("includes ON CONFLICT DO NOTHING", () => {
      const result = buildInsert("sleep", userId, row);
      expect(result.sql).toMatch(/ON CONFLICT.*DO NOTHING/i);
    });
  });

  // ── Interval types ───────────────────────────────────────────────────────
  describe("interval types", () => {
    const intervalTypes = [
      "mindfulMinutes",
      "handwashing",
      "toothbrushing",
      "highHeartRateEvents",
      "lowHeartRateEvents",
      "irregularHeartEvents",
    ];

    const row = {
      timestamp: "2024-01-15T10:00:00Z",
      end: "2024-01-15T10:15:00Z",
      durationMinutes: 15,
      source: "iPhone",
    };

    test.each(intervalTypes)(
      "%s inserts with start/end/duration",
      (dataType) => {
        const result = buildInsert(dataType, userId, row);
        expect(result).not.toBeNull();
        const table = TABLE_NAMES[dataType];
        expect(result.sql).toMatch(new RegExp(`INSERT INTO ${table}`, "i"));
        // values: [userId, date, tsStart, tsEnd, durationMinutes, source]
        expect(result.values).toHaveLength(6);
        expect(result.values[3]).toEqual(new Date("2024-01-15T10:15:00Z"));
        expect(result.values[4]).toBe(15);
      },
    );

    test("durationMinutes falls back to null when absent", () => {
      const result = buildInsert("mindfulMinutes", userId, {
        timestamp: "2024-01-15T10:00:00Z",
      });
      expect(result.values[4]).toBeNull();
    });
  });

  // ── Symptom types ─────────────────────────────────────────────────────────
  describe("symptom types", () => {
    const symptomTypes = [
      "symptomFatigue",
      "symptomHeadache",
      "symptomNausea",
      "symptomFever",
      "symptomSoreThroat",
      "symptomShortnessOfBreath",
      "symptomDizziness",
    ];

    const row = {
      timestamp: "2024-01-15T09:00:00Z",
      end: "2024-01-15T10:00:00Z",
      value: 3,
      source: "Manual",
    };

    test.each(symptomTypes)(
      "%s inserts severity from row.value",
      (dataType) => {
        const result = buildInsert(dataType, userId, row);
        const table = TABLE_NAMES[dataType];
        expect(result.sql).toMatch(new RegExp(`INSERT INTO ${table}`, "i"));
        // values: [userId, date, tsStart, tsEnd, severity, source]
        expect(result.values[4]).toBe(3);
      },
    );
  });

  // ── Reproductive types ───────────────────────────────────────────────────
  describe("reproductive types", () => {
    const reproTypes = [
      "menstrualFlow",
      "ovulationTest",
      "cervicalMucus",
      "sexualActivity",
      "pregnancy",
      "lactation",
    ];

    const row = {
      timestamp: "2024-01-15T00:00:00Z",
      end: "2024-01-15T01:00:00Z",
      value: 2,
      source: "Manual",
    };

    test.each(reproTypes)("%s inserts value correctly", (dataType) => {
      const result = buildInsert(dataType, userId, row);
      const table = TABLE_NAMES[dataType];
      expect(result.sql).toMatch(new RegExp(`INSERT INTO ${table}`, "i"));
      // values: [userId, date, tsStart, tsEnd, value, source]
      expect(result.values[4]).toBe(2);
    });
  });

  // ── Workouts ─────────────────────────────────────────────────────────────
  describe("workouts", () => {
    const row = {
      timestamp: "2024-01-15T07:00:00Z",
      end: "2024-01-15T08:00:00Z",
      type: "Running",
      durationMinutes: 60,
      calories: 500,
      distanceKm: 8.5,
      source: "Apple Watch",
    };

    test("inserts into workouts table", () => {
      const result = buildInsert("workouts", userId, row);
      expect(result.sql).toMatch(/INSERT INTO workouts/i);
    });

    test("maps all workout-specific fields", () => {
      const result = buildInsert("workouts", userId, row);
      // values: [userId, date, tsStart, tsEnd, type, durationMinutes, calories_kcal, distance_km, source]
      expect(result.values[4]).toBe("Running");
      expect(result.values[5]).toBe(60);
      expect(result.values[6]).toBe(500);
      expect(result.values[7]).toBe(8.5);
    });

    test("optional fields default to null", () => {
      const result = buildInsert("workouts", userId, {
        timestamp: "2024-01-15T07:00:00Z",
      });
      expect(result.values[4]).toBeNull(); // type
      expect(result.values[5]).toBeNull(); // durationMinutes
      expect(result.values[6]).toBeNull(); // calories
      expect(result.values[7]).toBeNull(); // distanceKm
    });
  });

  // ── Unknown dataType ──────────────────────────────────────────────────────
  test("returns null for unknown dataType", () => {
    const result = buildInsert("unknownType", userId, {
      timestamp: "2024-01-15T00:00:00Z",
      value: 1,
    });
    expect(result).toBeNull();
  });

  // ── Date extraction ───────────────────────────────────────────────────────
  test("derives recorded_date (YYYY-MM-DD) from timestamp", () => {
    const result = buildInsert("steps", userId, {
      timestamp: "2024-06-20T23:59:59Z",
      value: 100,
    });
    expect(result.values[1]).toBe("2024-06-20");
  });

  test("date is null when no timestamp is present", () => {
    const result = buildInsert("steps", userId, { value: 100 });
    expect(result.values[1]).toBeNull();
    expect(result.values[2]).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TABLE_NAMES
// ─────────────────────────────────────────────────────────────────────────────
describe("TABLE_NAMES", () => {
  test("maps steps → 'steps'", () => {
    expect(TABLE_NAMES.steps).toBe("steps");
  });

  test("maps distanceWalkingRunning → 'distance_walking_running'", () => {
    expect(TABLE_NAMES.distanceWalkingRunning).toBe("distance_walking_running");
  });

  test("maps hrv → 'hrv'", () => {
    expect(TABLE_NAMES.hrv).toBe("hrv");
  });

  test("maps vo2Max → 'vo2_max'", () => {
    expect(TABLE_NAMES.vo2Max).toBe("vo2_max");
  });

  test("maps workouts → 'workouts'", () => {
    expect(TABLE_NAMES.workouts).toBe("workouts");
  });

  test("maps symptomSoreThroat → 'symptom_sore_throat'", () => {
    expect(TABLE_NAMES.symptomSoreThroat).toBe("symptom_sore_throat");
  });

  test("maps dietaryVitaminD → 'dietary_vitamin_d'", () => {
    expect(TABLE_NAMES.dietaryVitaminD).toBe("dietary_vitamin_d");
  });

  test("maps menstrualFlow → 'menstrual_flow'", () => {
    expect(TABLE_NAMES.menstrualFlow).toBe("menstrual_flow");
  });

  test("all values are non-empty strings", () => {
    Object.values(TABLE_NAMES).forEach((name) => {
      expect(typeof name).toBe("string");
      expect(name.length).toBeGreaterThan(0);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// loadFromTable
// ─────────────────────────────────────────────────────────────────────────────
describe("loadFromTable", () => {
  test("queries the correct table and returns rows", async () => {
    const fakeRows = [{ id: 1, value: 10000 }];
    mockQuery.mockResolvedValueOnce({ rows: fakeRows });

    const result = await loadFromTable("steps", "user_abc");

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("FROM steps"),
      ["user_abc"],
    );
    expect(result).toEqual(fakeRows);
  });

  test("orders results by timestamp_start", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await loadFromTable("heartRate", "user_abc");
    const [sql] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/ORDER BY timestamp_start/i);
  });

  test("returns empty array for unknown dataType", async () => {
    const result = await loadFromTable("doesNotExist", "user_abc");
    expect(result).toEqual([]);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test("returns empty array when query throws", async () => {
    mockQuery.mockRejectedValueOnce(new Error("DB error"));
    const result = await loadFromTable("steps", "user_abc");
    expect(result).toEqual([]);
  });

  test("queries sleep table correctly", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await loadFromTable("sleep", "user_xyz");
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("FROM sleep"),
      ["user_xyz"],
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// createUser
// ─────────────────────────────────────────────────────────────────────────────
describe("createUser", () => {
  const userInput = {
    auth0Id: "auth0|abc123",
    email: "test@example.com",
    name: "Test User",
    picture: "https://example.com/pic.jpg",
    provider: "google",
    role: "user",
  };

  test("inserts a user and returns the created row", async () => {
    const fakeUser = { user_id: "auth0|abc123", email: "test@example.com" };
    mockQuery.mockResolvedValueOnce({ rows: [fakeUser] });

    const result = await createUser(userInput);

    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO users"),
      expect.arrayContaining(["auth0|abc123", "test@example.com", "Test User"]),
    );
    expect(result).toEqual(fakeUser);
  });

  test("returns null when there is a conflict (no row returned)", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const result = await createUser(userInput);
    expect(result).toBeNull();
  });

  test("defaults picture to null when not provided", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await createUser({ ...userInput, picture: undefined });
    const values = mockQuery.mock.calls[0][1];
    expect(values[3]).toBeNull();
  });

  test("uses ON CONFLICT DO NOTHING", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await createUser(userInput);
    const [sql] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/ON CONFLICT.*DO NOTHING/i);
  });

  test("throws when the DB query fails", async () => {
    mockQuery.mockRejectedValueOnce(new Error("connection refused"));
    await expect(createUser(userInput)).rejects.toThrow("connection refused");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// updateUserRole
// ─────────────────────────────────────────────────────────────────────────────
describe("updateUserRole", () => {
  test("updates the role and returns updated row", async () => {
    const fakeUser = { user_id: "auth0|abc", role: "admin" };
    mockQuery.mockResolvedValueOnce({ rows: [fakeUser] });

    const result = await updateUserRole("auth0|abc", "admin");

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE users"),
      ["auth0|abc", "admin"],
    );
    expect(result).toEqual(fakeUser);
  });

  test("returns null when user is not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const result = await updateUserRole("nonexistent", "admin");
    expect(result).toBeNull();
  });

  test("SQL sets role column", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await updateUserRole("auth0|abc", "admin");
    const [sql] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/SET role/i);
  });

  test("throws when the DB query fails", async () => {
    mockQuery.mockRejectedValueOnce(new Error("timeout"));
    await expect(updateUserRole("auth0|abc", "admin")).rejects.toThrow(
      "timeout",
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// initDB
// ─────────────────────────────────────────────────────────────────────────────
describe("initDB", () => {
  test("calls pool.query for every table definition", async () => {
    mockQuery.mockResolvedValue({});
    await initDB();
    // There should be one query per table definition
    expect(mockQuery.mock.calls.length).toBeGreaterThan(10);
  });

  test("every SQL call contains CREATE TABLE IF NOT EXISTS", async () => {
    mockQuery.mockResolvedValue({});
    await initDB();
    mockQuery.mock.calls.forEach(([sql]) => {
      expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS/i);
    });
  });

  test("propagates errors from pool.query", async () => {
    mockQuery.mockRejectedValueOnce(new Error("syntax error"));
    await expect(initDB()).rejects.toThrow("syntax error");
  });
});
