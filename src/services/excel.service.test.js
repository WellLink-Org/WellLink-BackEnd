/**
 * Unit tests for excel.service.js
 *
 * Run with: npx jest excel.service.test.js
 */

// ── Mock ExcelJS ──────────────────────────────────────────────────────────────
const mockAddRow = jest.fn();
const mockGetRow = jest.fn();
const mockGetColumn = jest.fn();
const mockMergeCells = jest.fn();
const mockAddWorksheet = jest.fn();

// Minimal cell / row factories
function makeCell() {
  return { value: null, font: null, fill: null, alignment: null, border: null };
}

function makeRow(colCount = 20) {
  const cells = Array.from({ length: colCount + 1 }, makeCell); // 1-indexed
  return {
    height: 0,
    cells,
    getCell: jest.fn((i) => cells[i] ?? makeCell()),
    eachCell: jest.fn(({ includeEmpty }, cb) => {
      cells.slice(1, colCount + 1).forEach((c) => cb(c));
    }),
    _addedValues: [],
  };
}

// mockGetRow returns a fresh row each time but tracks by rowNumber
const rowStore = {};
mockGetRow.mockImplementation((n) => {
  if (!rowStore[n]) rowStore[n] = makeRow();
  return rowStore[n];
});

mockGetColumn.mockReturnValue({ width: 0 });

const mockWorksheet = {
  views: [],
  addRow: mockAddRow,
  getRow: mockGetRow,
  getColumn: mockGetColumn,
  mergeCells: mockMergeCells,
};

mockAddWorksheet.mockReturnValue(mockWorksheet);

const mockWorkbook = { addWorksheet: mockAddWorksheet };
jest.mock("exceljs", () => ({
  Workbook: jest.fn(() => mockWorkbook),
}));

// ── Mock constants ────────────────────────────────────────────────────────────
jest.mock("../constants/health.constants", () => ({
  SHEET_DEFINITIONS: [
    ["Steps", "steps", true, "FF3B82F6", true],
    ["Heart Rate", "heartRate", false, "FFEF4444", true],
    ["Sleep", "sleep", false, "FF8B5CF6", false],
    ["Weight", "weight", false, "FF10B981", true],
  ],
}));

const { buildWorkbook } = require("./excel.service"); // adjust path

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function makeStepsRecord(overrides = {}) {
  return {
    timestamp_start: "2024-01-15T08:00:00Z",
    value: 5000,
    source: "Apple Watch",
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  Object.keys(rowStore).forEach((k) => delete rowStore[k]);
  mockGetRow.mockImplementation((n) => {
    if (!rowStore[n]) rowStore[n] = makeRow();
    return rowStore[n];
  });
  mockGetColumn.mockReturnValue({ width: 0 });
  mockAddWorksheet.mockReturnValue(mockWorksheet);
});

// ─────────────────────────────────────────────────────────────────────────────
// buildWorkbook — top-level
// ─────────────────────────────────────────────────────────────────────────────
describe("buildWorkbook", () => {
  test("returns the workbook instance", () => {
    const result = buildWorkbook({});
    expect(result).toBe(mockWorkbook);
  });

  test("creates one worksheet per SHEET_DEFINITION entry", () => {
    buildWorkbook({});
    expect(mockAddWorksheet).toHaveBeenCalledTimes(4);
  });

  test("creates worksheets with the correct sheet names", () => {
    buildWorkbook({});
    expect(mockAddWorksheet).toHaveBeenCalledWith("Steps");
    expect(mockAddWorksheet).toHaveBeenCalledWith("Heart Rate");
    expect(mockAddWorksheet).toHaveBeenCalledWith("Sleep");
    expect(mockAddWorksheet).toHaveBeenCalledWith("Weight");
  });

  test("adds a 'No data' row when a data key has no records", () => {
    buildWorkbook({});
    // All sheets empty → each calls addRow once
    expect(mockAddRow).toHaveBeenCalledWith([
      "No data recorded for this period",
    ]);
  });

  test("does not crash when data is an empty object", () => {
    expect(() => buildWorkbook({})).not.toThrow();
  });

  test("does not crash when a data key is missing entirely", () => {
    expect(() => buildWorkbook({ steps: undefined })).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// groupByDay (tested via buildWorkbook behaviour)
// ─────────────────────────────────────────────────────────────────────────────
describe("groupByDay (via buildWorkbook)", () => {
  test("groups records on the same date together", () => {
    const data = {
      steps: [
        makeStepsRecord({
          timestamp_start: "2024-01-15T08:00:00Z",
          value: 1000,
        }),
        makeStepsRecord({
          timestamp_start: "2024-01-15T20:00:00Z",
          value: 2000,
        }),
        makeStepsRecord({
          timestamp_start: "2024-01-16T08:00:00Z",
          value: 3000,
        }),
      ],
    };
    // Should not throw and should produce output for 2 distinct days
    expect(() => buildWorkbook(data)).not.toThrow();
    // Day-header row for day 1 should mention "2 records"
    const allValues = Object.values(rowStore).map((r) => r.getCell(1).value);
    const dayHeaders = allValues.filter(
      (v) => typeof v === "string" && v.includes("records"),
    );
    expect(dayHeaders.some((v) => v.includes("2 records"))).toBe(true);
    expect(dayHeaders.some((v) => v.includes("1 records"))).toBe(true);
  });

  test("handles timestamp field alias: r.timestamp", () => {
    const data = {
      steps: [
        {
          timestamp: "2024-02-01T10:00:00Z",
          value: 800,
          source: "Apple Watch",
        },
      ],
    };
    expect(() => buildWorkbook(data)).not.toThrow();
  });

  test("handles timestamp field alias: r.start", () => {
    const data = {
      steps: [
        { start: "2024-02-01T10:00:00Z", value: 800, source: "Apple Watch" },
      ],
    };
    expect(() => buildWorkbook(data)).not.toThrow();
  });

  test("handles timestamp field alias: r.date", () => {
    const data = {
      steps: [
        { date: "2024-02-01T10:00:00Z", value: 800, source: "Apple Watch" },
      ],
    };
    expect(() => buildWorkbook(data)).not.toThrow();
  });

  test("handles Date object as timestamp", () => {
    const data = {
      steps: [
        { timestamp_start: new Date("2024-02-01T10:00:00Z"), value: 800 },
      ],
    };
    expect(() => buildWorkbook(data)).not.toThrow();
  });

  test("skips records with no parseable timestamp", () => {
    const data = {
      steps: [
        { value: 100 }, // no timestamp fields at all
        makeStepsRecord({
          timestamp_start: "2024-03-01T00:00:00Z",
          value: 200,
        }),
      ],
    };
    // Should still build without throwing; only the valid record appears
    expect(() => buildWorkbook(data)).not.toThrow();
  });

  test("preferWatch filters to watch source when watch records exist", () => {
    // Steps sheet has preferWatch=true
    const data = {
      steps: [
        makeStepsRecord({ source: "iPhone", value: 100 }),
        makeStepsRecord({ source: "Apple Watch", value: 999 }),
      ],
    };
    expect(() => buildWorkbook(data)).not.toThrow();
    // Cell values written via getRow; the watch record (999) should appear
    const writtenValues = Object.values(rowStore).flatMap((r) =>
      r.cells.map((c) => c.value),
    );
    expect(writtenValues).toContain(999);
    // iPhone-only value should NOT appear (filtered out when watch is present)
    expect(writtenValues).not.toContain(100);
  });

  test("keeps all sources when no watch record exists for a day", () => {
    const data = {
      steps: [
        makeStepsRecord({ source: "iPhone", value: 500 }),
        makeStepsRecord({ source: "Garmin", value: 300 }),
      ],
    };
    expect(() => buildWorkbook(data)).not.toThrow();
    const writtenValues = Object.values(rowStore).flatMap((r) =>
      r.cells.map((c) => c.value),
    );
    expect(writtenValues).toContain(500);
    expect(writtenValues).toContain(300);
  });

  test("sorts days chronologically", () => {
    const data = {
      steps: [
        makeStepsRecord({ timestamp_start: "2024-03-10T00:00:00Z", value: 1 }),
        makeStepsRecord({ timestamp_start: "2024-01-05T00:00:00Z", value: 2 }),
        makeStepsRecord({ timestamp_start: "2024-02-20T00:00:00Z", value: 3 }),
      ],
    };
    expect(() => buildWorkbook(data)).not.toThrow();
    const dayHeaders = Object.values(rowStore)
      .map((r) => r.getCell(1).value)
      .filter((v) => typeof v === "string" && v.includes("📅"));
    // Extract dates from headers and verify ascending order
    const dates = dayHeaders.map((h) => h.match(/\d{4}/)?.[0]).filter(Boolean);
    expect(dates).toEqual([...dates].sort());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getSummaryType (tested via totals row behaviour)
// ─────────────────────────────────────────────────────────────────────────────
describe("getSummaryType (via totals rows)", () => {
  // We verify indirectly: if getSummaryType returns "sum", the totals cell
  // value equals the arithmetic sum; for "avg" it equals the mean.

  test("sums 'value' field (sum type)", () => {
    const data = {
      steps: [
        makeStepsRecord({ value: 1000 }),
        makeStepsRecord({ value: 2000 }),
      ],
    };
    buildWorkbook(data);
    const writtenValues = Object.values(rowStore).flatMap((r) =>
      r.cells.map((c) => c.value),
    );
    expect(writtenValues).toContain(3000); // sum
  });

  test("averages _bpm fields (avg type)", () => {
    const data = {
      heartRate: [
        { timestamp_start: "2024-01-15T08:00:00Z", value_bpm: 60 },
        { timestamp_start: "2024-01-15T09:00:00Z", value_bpm: 80 },
      ],
    };
    buildWorkbook(data);
    const writtenValues = Object.values(rowStore).flatMap((r) =>
      r.cells.map((c) => c.value),
    );
    expect(writtenValues).toContain(70); // avg
  });

  test("sums _kcal fields", () => {
    const data = {
      steps: [
        { timestamp_start: "2024-01-15T08:00:00Z", value_kcal: 200 },
        { timestamp_start: "2024-01-15T09:00:00Z", value_kcal: 300 },
      ],
    };
    buildWorkbook(data);
    const writtenValues = Object.values(rowStore).flatMap((r) =>
      r.cells.map((c) => c.value),
    );
    expect(writtenValues).toContain(500);
  });

  test("sums _meters fields", () => {
    const data = {
      steps: [
        { timestamp_start: "2024-01-15T08:00:00Z", value_meters: 400 },
        { timestamp_start: "2024-01-15T09:00:00Z", value_meters: 600 },
      ],
    };
    buildWorkbook(data);
    const writtenValues = Object.values(rowStore).flatMap((r) =>
      r.cells.map((c) => c.value),
    );
    expect(writtenValues).toContain(1000);
  });

  test("averages _pct fields", () => {
    const data = {
      steps: [
        { timestamp_start: "2024-01-15T08:00:00Z", value_pct: 90 },
        { timestamp_start: "2024-01-15T09:00:00Z", value_pct: 100 },
      ],
    };
    buildWorkbook(data);
    const writtenValues = Object.values(rowStore).flatMap((r) =>
      r.cells.map((c) => c.value),
    );
    expect(writtenValues).toContain(95);
  });

  test("averages _celsius fields", () => {
    const data = {
      steps: [
        { timestamp_start: "2024-01-15T08:00:00Z", value_celsius: 36.5 },
        { timestamp_start: "2024-01-15T09:00:00Z", value_celsius: 37.5 },
      ],
    };
    buildWorkbook(data);
    const writtenValues = Object.values(rowStore).flatMap((r) =>
      r.cells.map((c) => c.value),
    );
    expect(writtenValues).toContain(37);
  });

  test("returns null for non-numeric keys (id, text, timestamps) — no totals cell", () => {
    // 'source' is a text field — its column should not appear as a total
    const data = {
      steps: [
        makeStepsRecord({ source: "Apple Watch" }),
        makeStepsRecord({ source: "Apple Watch" }),
      ],
    };
    buildWorkbook(data);
    // No cell should have the string value "Apple Watch" in a totals position
    // (totals row only gets numeric cells set)
    const writtenValues = Object.values(rowStore).flatMap((r) =>
      r.cells.map((c) => c.value),
    );
    // The total aggregation for 'source' should not be "Apple WatchApple Watch"
    expect(writtenValues).not.toContain("Apple WatchApple Watch");
  });

  test("rounds totals to 2 decimal places", () => {
    const data = {
      steps: [
        { timestamp_start: "2024-01-15T08:00:00Z", value_bpm: 1 },
        { timestamp_start: "2024-01-15T09:00:00Z", value_bpm: 2 },
        { timestamp_start: "2024-01-15T10:00:00Z", value_bpm: 2 },
      ],
    };
    buildWorkbook(data);
    const writtenValues = Object.values(rowStore).flatMap((r) =>
      r.cells.map((c) => c.value),
    );
    // avg = 1.67 (rounded to 2dp)
    expect(writtenValues).toContain(1.67);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildSheet — sheet structure
// ─────────────────────────────────────────────────────────────────────────────
describe("buildSheet structure", () => {
  test("adds 'No data recorded for this period' when records array is empty", () => {
    buildWorkbook({ steps: [] });
    expect(mockAddRow).toHaveBeenCalledWith([
      "No data recorded for this period",
    ]);
  });

  test("disables grid lines on each worksheet", () => {
    buildWorkbook({});
    expect(mockWorksheet.views).toEqual([{ showGridLines: false }]);
  });

  test("sets column width based on key length (min 20)", () => {
    buildWorkbook({ steps: [makeStepsRecord()] });
    expect(mockGetColumn).toHaveBeenCalled();
    // All assigned widths should be >= 20
    const assignedWidths = mockGetColumn.mock.results
      .map((r) => r.value.width)
      .filter((w) => w > 0);
    assignedWidths.forEach((w) => expect(w).toBeGreaterThanOrEqual(20));
  });

  test("day header row mentions record count", () => {
    const data = {
      steps: [makeStepsRecord(), makeStepsRecord()],
    };
    buildWorkbook(data);
    const dayHeaders = Object.values(rowStore)
      .map((r) => r.getCell(1).value)
      .filter((v) => typeof v === "string" && v.includes("📅"));
    expect(dayHeaders.length).toBeGreaterThan(0);
    expect(dayHeaders[0]).toContain("2 records");
  });

  test("column header row contains all record keys", () => {
    const data = {
      steps: [makeStepsRecord()],
    };
    buildWorkbook(data);
    const allCellValues = Object.values(rowStore).flatMap((r) =>
      r.cells.map((c) => c.value),
    );
    expect(allCellValues).toContain("timestamp_start");
    expect(allCellValues).toContain("value");
    expect(allCellValues).toContain("source");
  });

  test("data row writes numeric values as numbers", () => {
    const data = {
      steps: [makeStepsRecord({ value: 12345 })],
    };
    buildWorkbook(data);
    const writtenValues = Object.values(rowStore).flatMap((r) =>
      r.cells.map((c) => c.value),
    );
    expect(writtenValues).toContain(12345);
  });

  test("data row writes null/undefined as empty string", () => {
    const data = {
      steps: [{ timestamp_start: "2024-01-15T08:00:00Z", value: null }],
    };
    buildWorkbook(data);
    const writtenValues = Object.values(rowStore).flatMap((r) =>
      r.cells.map((c) => c.value),
    );
    expect(writtenValues).toContain("");
  });

  test("data row writes non-numeric, non-null values as strings", () => {
    const data = {
      steps: [makeStepsRecord({ source: "Apple Watch" })],
    };
    buildWorkbook(data);
    const writtenValues = Object.values(rowStore).flatMap((r) =>
      r.cells.map((c) => c.value),
    );
    expect(writtenValues).toContain("Apple Watch");
  });

  test("showTotals=false skips the totals row (Sleep sheet)", () => {
    // Sleep has showTotals=false in our mock SHEET_DEFINITIONS
    const data = {
      sleep: [{ timestamp_start: "2024-01-15T08:00:00Z", value: 4 }],
    };
    buildWorkbook(data);
    const writtenValues = Object.values(rowStore).flatMap((r) =>
      r.cells.map((c) => c.value),
    );
    // "DAILY TOTAL" or "DAILY AVG" labels should NOT appear
    expect(writtenValues).not.toContain("DAILY TOTAL");
    expect(writtenValues).not.toContain("DAILY AVG");
  });

  test("totals label is DAILY TOTAL for sum fields", () => {
    const data = {
      steps: [makeStepsRecord({ value: 5000 })],
    };
    buildWorkbook(data);
    const writtenValues = Object.values(rowStore).flatMap((r) =>
      r.cells.map((c) => c.value),
    );
    expect(writtenValues).toContain("DAILY TOTAL");
  });

  test("totals label is DAILY AVG for avg-only fields", () => {
    const data = {
      heartRate: [{ timestamp_start: "2024-01-15T08:00:00Z", value_bpm: 72 }],
    };
    buildWorkbook(data);
    const writtenValues = Object.values(rowStore).flatMap((r) =>
      r.cells.map((c) => c.value),
    );
    expect(writtenValues).toContain("DAILY AVG");
  });

  test("mergeCells is called for multi-column sheets", () => {
    const data = {
      // makeStepsRecord has 3 keys → allKeys.length > 1 → mergeCells called
      steps: [makeStepsRecord()],
    };
    buildWorkbook(data);
    expect(mockMergeCells).toHaveBeenCalled();
  });

  test("handles multiple days producing separate day-header rows", () => {
    const data = {
      steps: [
        makeStepsRecord({ timestamp_start: "2024-01-10T08:00:00Z" }),
        makeStepsRecord({ timestamp_start: "2024-01-11T08:00:00Z" }),
        makeStepsRecord({ timestamp_start: "2024-01-12T08:00:00Z" }),
      ],
    };
    buildWorkbook(data);
    const dayHeaders = Object.values(rowStore)
      .map((r) => r.getCell(1).value)
      .filter((v) => typeof v === "string" && v.includes("📅"));
    expect(dayHeaders.length).toBe(3);
  });
});
