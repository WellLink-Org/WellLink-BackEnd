/**
 * Unit tests for health.controller.js
 *
 * Run with: npx jest health.controller.test.js
 */

// ── Mock services before importing controller ─────────────────────────────────
jest.mock("../services/health.service", () => ({
  syncHealthData: jest.fn(),
  loadAllRecords: jest.fn(),
}));

jest.mock("../services/excel.service", () => ({
  buildWorkbook: jest.fn(),
}));

const healthService = require("../services/health.service");
const excelService = require("../services/excel.service");
const { sync, exportExcel } = require("./health.controller"); // adjust path as needed

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
}

function makeWorkbook() {
  return {
    xlsx: {
      write: jest.fn().mockResolvedValue(undefined),
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// sync
// ─────────────────────────────────────────────────────────────────────────────
describe("sync", () => {
  describe("success", () => {
    test("calls healthService.syncHealthData with userId and full body", async () => {
      healthService.syncHealthData.mockResolvedValueOnce(undefined);
      const body = { userId: "user_abc", steps: [{ value: 1000 }] };
      const req = { body };
      const res = makeRes();
      const next = jest.fn();

      await sync(req, res, next);

      expect(healthService.syncHealthData).toHaveBeenCalledTimes(1);
      expect(healthService.syncHealthData).toHaveBeenCalledWith(
        "user_abc",
        body,
      );
    });

    test("falls back to 'user_123' when userId is absent from body", async () => {
      healthService.syncHealthData.mockResolvedValueOnce(undefined);
      const req = { body: { steps: [] } };
      const res = makeRes();

      await sync(req, res, jest.fn());

      expect(healthService.syncHealthData).toHaveBeenCalledWith(
        "user_123",
        req.body,
      );
    });

    test("responds with success JSON", async () => {
      healthService.syncHealthData.mockResolvedValueOnce(undefined);
      const req = { body: { userId: "user_abc" } };
      const res = makeRes();
      const next = jest.fn();

      await sync(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Data saved to database",
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("does not call res.status on success (implicit 200)", async () => {
      healthService.syncHealthData.mockResolvedValueOnce(undefined);
      const req = { body: { userId: "user_abc" } };
      const res = makeRes();

      await sync(req, res, jest.fn());

      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    test("calls next(err) when syncHealthData throws", async () => {
      const error = new Error("DB write failed");
      healthService.syncHealthData.mockRejectedValueOnce(error);
      const req = { body: { userId: "user_abc" } };
      const res = makeRes();
      const next = jest.fn();

      await sync(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.json).not.toHaveBeenCalled();
    });

    test("does not call res.json when error is forwarded", async () => {
      healthService.syncHealthData.mockRejectedValueOnce(new Error("fail"));
      const req = { body: {} };
      const res = makeRes();
      const next = jest.fn();

      await sync(req, res, next);

      expect(res.json).not.toHaveBeenCalled();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// exportExcel
// ─────────────────────────────────────────────────────────────────────────────
describe("exportExcel", () => {
  describe("404 — no data", () => {
    test("returns 404 when loadAllRecords returns an empty object", async () => {
      healthService.loadAllRecords.mockResolvedValueOnce({});
      const req = { params: { userId: "user_abc" } };
      const res = makeRes();
      const next = jest.fn();

      await exportExcel(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "No data in database for this user.",
      });
    });

    test("does not build a workbook when there is no data", async () => {
      healthService.loadAllRecords.mockResolvedValueOnce({});
      const req = { params: { userId: "user_abc" } };
      const res = makeRes();

      await exportExcel(req, res, jest.fn());

      expect(excelService.buildWorkbook).not.toHaveBeenCalled();
    });

    test("does not call res.end when returning 404", async () => {
      healthService.loadAllRecords.mockResolvedValueOnce({});
      const req = { params: { userId: "user_abc" } };
      const res = makeRes();

      await exportExcel(req, res, jest.fn());

      expect(res.end).not.toHaveBeenCalled();
    });
  });

  describe("success", () => {
    const mockData = { steps: [{ value: 5000 }], heartRate: [{ value: 72 }] };

    test("calls loadAllRecords with the correct userId from params", async () => {
      healthService.loadAllRecords.mockResolvedValueOnce(mockData);
      excelService.buildWorkbook.mockReturnValueOnce(makeWorkbook());
      const req = { params: { userId: "user_xyz" } };
      const res = makeRes();

      await exportExcel(req, res, jest.fn());

      expect(healthService.loadAllRecords).toHaveBeenCalledWith("user_xyz");
    });

    test("falls back to 'user_123' when userId param is absent", async () => {
      healthService.loadAllRecords.mockResolvedValueOnce(mockData);
      excelService.buildWorkbook.mockReturnValueOnce(makeWorkbook());
      const req = { params: {} };
      const res = makeRes();

      await exportExcel(req, res, jest.fn());

      expect(healthService.loadAllRecords).toHaveBeenCalledWith("user_123");
    });

    test("calls excelService.buildWorkbook with the loaded data", async () => {
      healthService.loadAllRecords.mockResolvedValueOnce(mockData);
      excelService.buildWorkbook.mockReturnValueOnce(makeWorkbook());
      const req = { params: { userId: "user_xyz" } };
      const res = makeRes();

      await exportExcel(req, res, jest.fn());

      expect(excelService.buildWorkbook).toHaveBeenCalledWith(mockData);
    });

    test("sets Content-Type header for xlsx", async () => {
      healthService.loadAllRecords.mockResolvedValueOnce(mockData);
      excelService.buildWorkbook.mockReturnValueOnce(makeWorkbook());
      const req = { params: { userId: "user_xyz" } };
      const res = makeRes();

      await exportExcel(req, res, jest.fn());

      expect(res.setHeader).toHaveBeenCalledWith(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
    });

    test("sets Content-Disposition header with correct userId and date", async () => {
      healthService.loadAllRecords.mockResolvedValueOnce(mockData);
      excelService.buildWorkbook.mockReturnValueOnce(makeWorkbook());
      const req = { params: { userId: "user_xyz" } };
      const res = makeRes();

      const today = new Date().toISOString().split("T")[0];
      await exportExcel(req, res, jest.fn());

      expect(res.setHeader).toHaveBeenCalledWith(
        "Content-Disposition",
        `attachment; filename="healthdata_user_xyz_${today}.xlsx"`,
      );
    });

    test("calls workbook.xlsx.write with the response object", async () => {
      healthService.loadAllRecords.mockResolvedValueOnce(mockData);
      const wb = makeWorkbook();
      excelService.buildWorkbook.mockReturnValueOnce(wb);
      const req = { params: { userId: "user_xyz" } };
      const res = makeRes();

      await exportExcel(req, res, jest.fn());

      expect(wb.xlsx.write).toHaveBeenCalledWith(res);
    });

    test("calls res.end after writing the workbook", async () => {
      healthService.loadAllRecords.mockResolvedValueOnce(mockData);
      excelService.buildWorkbook.mockReturnValueOnce(makeWorkbook());
      const req = { params: { userId: "user_xyz" } };
      const res = makeRes();

      await exportExcel(req, res, jest.fn());

      expect(res.end).toHaveBeenCalledTimes(1);
    });

    test("does not call next on success", async () => {
      healthService.loadAllRecords.mockResolvedValueOnce(mockData);
      excelService.buildWorkbook.mockReturnValueOnce(makeWorkbook());
      const req = { params: { userId: "user_xyz" } };
      const res = makeRes();
      const next = jest.fn();

      await exportExcel(req, res, next);

      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    test("calls next(err) when loadAllRecords throws", async () => {
      const error = new Error("DB read failed");
      healthService.loadAllRecords.mockRejectedValueOnce(error);
      const req = { params: { userId: "user_xyz" } };
      const res = makeRes();
      const next = jest.fn();

      await exportExcel(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.json).not.toHaveBeenCalled();
    });

    test("calls next(err) when buildWorkbook throws", async () => {
      const error = new Error("Excel build failed");
      healthService.loadAllRecords.mockResolvedValueOnce({ steps: [] });
      excelService.buildWorkbook.mockImplementationOnce(() => {
        throw error;
      });
      const req = { params: { userId: "user_xyz" } };
      const res = makeRes();
      const next = jest.fn();

      await exportExcel(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    test("calls next(err) when workbook.xlsx.write rejects", async () => {
      const error = new Error("stream write failed");
      healthService.loadAllRecords.mockResolvedValueOnce({ steps: [] });
      const wb = makeWorkbook();
      wb.xlsx.write.mockRejectedValueOnce(error);
      excelService.buildWorkbook.mockReturnValueOnce(wb);
      const req = { params: { userId: "user_xyz" } };
      const res = makeRes();
      const next = jest.fn();

      await exportExcel(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.end).not.toHaveBeenCalled();
    });
  });
});
