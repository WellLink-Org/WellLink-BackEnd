/**
 * Unit tests for health.service.js
 *
 * Run with: npx jest health.service.test.js
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────
const mockQuery = jest.fn();

jest.mock("../config/database", () => ({
  pool: { query: mockQuery },
  buildInsert: jest.fn(),
  loadFromTable: jest.fn(),
  TABLE_NAMES: {
    steps: "steps",
    heartRate: "heart_rate",
    sleep: "sleep",
    weight: "weight",
  },
}));

jest.mock("../constants/health.constants", () => ({
  DATA_TYPES: ["steps", "heartRate", "sleep", "weight"],
}));

const {
  pool,
  buildInsert,
  loadFromTable,
  TABLE_NAMES,
} = require("../config/database");
const {
  saveRecords,
  loadAllRecords,
  syncHealthData,
} = require("./health.service"); // adjust path

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// saveRecords
// ─────────────────────────────────────────────────────────────────────────────
describe("saveRecords", () => {
  const userId = "user_abc";
  const dataType = "steps";

  test("does nothing when rows is undefined", async () => {
    await saveRecords(userId, dataType, undefined);
    expect(buildInsert).not.toHaveBeenCalled();
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test("does nothing when rows is an empty array", async () => {
    await saveRecords(userId, dataType, []);
    expect(buildInsert).not.toHaveBeenCalled();
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test("does nothing when rows is null", async () => {
    await saveRecords(userId, dataType, null);
    expect(buildInsert).not.toHaveBeenCalled();
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test("calls buildInsert for each row", async () => {
    const rows = [
      { timestamp: "2024-01-01T00:00:00Z", value: 100 },
      { timestamp: "2024-01-02T00:00:00Z", value: 200 },
    ];
    buildInsert.mockReturnValue({ sql: "INSERT ...", values: [] });
    mockQuery.mockResolvedValue({});

    await saveRecords(userId, dataType, rows);

    expect(buildInsert).toHaveBeenCalledTimes(2);
    expect(buildInsert).toHaveBeenNthCalledWith(1, dataType, userId, rows[0]);
    expect(buildInsert).toHaveBeenNthCalledWith(2, dataType, userId, rows[1]);
  });

  test("calls pool.query with sql and values from buildInsert", async () => {
    const insert = {
      sql: "INSERT INTO steps ...",
      values: ["user_abc", "2024-01-01", 100],
    };
    buildInsert.mockReturnValue(insert);
    mockQuery.mockResolvedValue({});

    await saveRecords(userId, dataType, [{ value: 100 }]);

    expect(mockQuery).toHaveBeenCalledWith(insert.sql, insert.values);
  });

  test("skips pool.query when buildInsert returns null", async () => {
    buildInsert.mockReturnValue(null);

    await saveRecords(userId, dataType, [{ value: 100 }]);

    expect(mockQuery).not.toHaveBeenCalled();
  });

  test("only queries for rows where buildInsert returns a value", async () => {
    buildInsert
      .mockReturnValueOnce({ sql: "INSERT ...", values: [] })
      .mockReturnValueOnce(null)
      .mockReturnValueOnce({ sql: "INSERT ...", values: [] });
    mockQuery.mockResolvedValue({});

    await saveRecords(userId, dataType, [{}, {}, {}]);

    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  test("processes rows sequentially (awaits each query)", async () => {
    const order = [];
    buildInsert.mockReturnValue({ sql: "INSERT ...", values: [] });
    mockQuery
      .mockImplementationOnce(() => {
        order.push(1);
        return Promise.resolve({});
      })
      .mockImplementationOnce(() => {
        order.push(2);
        return Promise.resolve({});
      });

    await saveRecords(userId, dataType, [{}, {}]);

    expect(order).toEqual([1, 2]);
  });

  test("propagates errors from pool.query", async () => {
    buildInsert.mockReturnValue({ sql: "INSERT ...", values: [] });
    mockQuery.mockRejectedValueOnce(new Error("constraint violation"));

    await expect(saveRecords(userId, dataType, [{ value: 1 }])).rejects.toThrow(
      "constraint violation",
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// loadAllRecords
// ─────────────────────────────────────────────────────────────────────────────
describe("loadAllRecords", () => {
  const userId = "user_abc";

  test("returns empty object when all tables have no rows", async () => {
    loadFromTable.mockResolvedValue([]);

    const result = await loadAllRecords(userId);

    expect(result).toEqual({});
  });

  test("calls loadFromTable for every key in TABLE_NAMES", async () => {
    loadFromTable.mockResolvedValue([]);

    await loadAllRecords(userId);

    const expectedKeys = Object.keys(TABLE_NAMES);
    expect(loadFromTable).toHaveBeenCalledTimes(expectedKeys.length);
    expectedKeys.forEach((key) => {
      expect(loadFromTable).toHaveBeenCalledWith(key, userId);
    });
  });

  test("includes only data types that returned rows", async () => {
    loadFromTable.mockImplementation((dataType) => {
      if (dataType === "steps") return Promise.resolve([{ value: 1000 }]);
      if (dataType === "heartRate") return Promise.resolve([{ value: 72 }]);
      return Promise.resolve([]);
    });

    const result = await loadAllRecords(userId);

    expect(result).toEqual({
      steps: [{ value: 1000 }],
      heartRate: [{ value: 72 }],
    });
    expect(result.sleep).toBeUndefined();
    expect(result.weight).toBeUndefined();
  });

  test("includes all data types when all tables have rows", async () => {
    loadFromTable.mockResolvedValue([{ value: 1 }]);

    const result = await loadAllRecords(userId);

    expect(Object.keys(result)).toEqual(Object.keys(TABLE_NAMES));
  });

  test("passes the userId to every loadFromTable call", async () => {
    loadFromTable.mockResolvedValue([]);

    await loadAllRecords("specific_user_99");

    loadFromTable.mock.calls.forEach(([, uid]) => {
      expect(uid).toBe("specific_user_99");
    });
  });

  test("propagates errors from loadFromTable", async () => {
    loadFromTable.mockRejectedValueOnce(new Error("table missing"));

    await expect(loadAllRecords(userId)).rejects.toThrow("table missing");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// syncHealthData
// ─────────────────────────────────────────────────────────────────────────────
describe("syncHealthData", () => {
  const userId = "user_abc";

  // ── steps normalisation ──────────────────────────────────────────────────
  describe("steps normalisation", () => {
    test("normalises steps using timestamp when present", async () => {
      buildInsert.mockReturnValue({ sql: "INSERT ...", values: [] });
      mockQuery.mockResolvedValue({});

      const data = {
        steps: [
          { timestamp: "2024-01-01T08:00:00Z", value: 500, source: "Fitbit" },
        ],
      };

      await syncHealthData(userId, data);

      expect(data.steps[0]).toEqual({
        timestamp: "2024-01-01T08:00:00Z",
        value: 500,
        source: "Fitbit",
      });
    });

    test("prefers s.date over s.timestamp for normalisation", async () => {
      buildInsert.mockReturnValue({ sql: "INSERT ...", values: [] });
      mockQuery.mockResolvedValue({});

      const data = {
        steps: [
          {
            date: "2024-03-10T00:00:00Z",
            timestamp: "2024-01-01T00:00:00Z",
            value: 300,
          },
        ],
      };

      await syncHealthData(userId, data);

      expect(data.steps[0].timestamp).toBe("2024-03-10T00:00:00Z");
    });

    test("defaults source to 'Apple Watch' when source is absent", async () => {
      buildInsert.mockReturnValue({ sql: "INSERT ...", values: [] });
      mockQuery.mockResolvedValue({});

      const data = {
        steps: [{ timestamp: "2024-01-01T00:00:00Z", value: 200 }],
      };

      await syncHealthData(userId, data);

      expect(data.steps[0].source).toBe("Apple Watch");
    });

    test("preserves existing source during normalisation", async () => {
      buildInsert.mockReturnValue({ sql: "INSERT ...", values: [] });
      mockQuery.mockResolvedValue({});

      const data = {
        steps: [
          { timestamp: "2024-01-01T00:00:00Z", value: 200, source: "Garmin" },
        ],
      };

      await syncHealthData(userId, data);

      expect(data.steps[0].source).toBe("Garmin");
    });

    test("does not throw when data.steps is absent", async () => {
      await expect(
        syncHealthData(userId, { heartRate: [] }),
      ).resolves.not.toThrow();
    });

    test("does not normalise when data.steps is not an array", async () => {
      const data = { steps: "not-an-array" };
      // should not throw, steps will simply not be iterated by DATA_TYPES loop
      await expect(syncHealthData(userId, data)).resolves.not.toThrow();
    });
  });

  // ── record saving ────────────────────────────────────────────────────────
  describe("record saving", () => {
    test("calls pool.query for each record in a non-empty data type", async () => {
      buildInsert.mockReturnValue({ sql: "INSERT ...", values: [] });
      mockQuery.mockResolvedValue({});

      const data = {
        heartRate: [{ value: 70 }, { value: 75 }, { value: 80 }],
      };

      await syncHealthData(userId, data);

      expect(mockQuery).toHaveBeenCalledTimes(3);
    });

    test("skips data types with empty arrays", async () => {
      buildInsert.mockReturnValue({ sql: "INSERT ...", values: [] });
      mockQuery.mockResolvedValue({});

      const data = { steps: [], heartRate: [{ value: 72 }] };

      await syncHealthData(userId, data);

      // Only 1 call for the single heartRate record
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    test("skips data types not present in data", async () => {
      buildInsert.mockReturnValue({ sql: "INSERT ...", values: [] });
      mockQuery.mockResolvedValue({});

      await syncHealthData(userId, {});

      expect(mockQuery).not.toHaveBeenCalled();
    });

    test("saves records for multiple data types", async () => {
      buildInsert.mockReturnValue({ sql: "INSERT ...", values: [] });
      mockQuery.mockResolvedValue({});

      const data = {
        steps: [{ value: 5000 }],
        heartRate: [{ value: 72 }],
        sleep: [{ value: 4 }],
      };

      await syncHealthData(userId, data);

      // 1 record per type × 3 types = 3 queries
      expect(mockQuery).toHaveBeenCalledTimes(3);
    });

    test("passes correct dataType to saveRecords / buildInsert", async () => {
      buildInsert.mockReturnValue({ sql: "INSERT ...", values: [] });
      mockQuery.mockResolvedValue({});

      const data = { weight: [{ value: 70 }] };

      await syncHealthData(userId, data);

      expect(buildInsert).toHaveBeenCalledWith(
        "weight",
        userId,
        data.weight[0],
      );
    });
  });

  // ── error propagation ────────────────────────────────────────────────────
  describe("error propagation", () => {
    test("propagates errors from pool.query", async () => {
      buildInsert.mockReturnValue({ sql: "INSERT ...", values: [] });
      mockQuery.mockRejectedValueOnce(new Error("write failed"));

      const data = { steps: [{ value: 100 }] };

      await expect(syncHealthData(userId, data)).rejects.toThrow(
        "write failed",
      );
    });
  });
});
