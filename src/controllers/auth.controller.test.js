/**
 * Unit tests for auth.controller.js
 *
 * Run with: npx jest auth.controller.test.js
 */

// ── Mock auth service before importing controller ─────────────────────────────
jest.mock("../services/auth.service", () => ({
  create: jest.fn(),
  updateRole: jest.fn(),
}));

const authService = require("../services/auth.service");
const { syncUser, updateRole } = require("./auth.controller"); // adjust path as needed

// ── Helpers ───────────────────────────────────────────────────────────────────
const VALID_SECRET = "test-secret-123";

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function makeReq({ secret = VALID_SECRET, body = {} } = {}) {
  return {
    headers: { "x-auth0-secret": secret },
    body,
  };
}

beforeAll(() => {
  process.env.AUTH0_SYNC_SECRET = VALID_SECRET;
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// syncUser
// ─────────────────────────────────────────────────────────────────────────────
describe("syncUser", () => {
  describe("authorization", () => {
    test("returns 401 when secret header is missing", async () => {
      const req = { headers: {}, body: {} };
      const res = makeRes();
      const next = jest.fn();

      await syncUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
      expect(authService.create).not.toHaveBeenCalled();
    });

    test("returns 401 when secret header is wrong", async () => {
      const req = makeReq({ secret: "wrong-secret" });
      const res = makeRes();
      const next = jest.fn();

      await syncUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
      expect(authService.create).not.toHaveBeenCalled();
    });

    test("returns 401 when secret header is empty string", async () => {
      const req = makeReq({ secret: "" });
      const res = makeRes();
      const next = jest.fn();

      await syncUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(authService.create).not.toHaveBeenCalled();
    });
  });

  describe("success", () => {
    test("calls authService.create with req.body", async () => {
      const body = { auth0Id: "auth0|abc", email: "a@b.com", name: "Alice" };
      const req = makeReq({ body });
      const res = makeRes();
      const next = jest.fn();
      authService.create.mockResolvedValueOnce(undefined);

      await syncUser(req, res, next);

      expect(authService.create).toHaveBeenCalledTimes(1);
      expect(authService.create).toHaveBeenCalledWith(body);
    });

    test("responds with success JSON on valid request", async () => {
      authService.create.mockResolvedValueOnce(undefined);
      const req = makeReq({ body: { auth0Id: "auth0|abc" } });
      const res = makeRes();
      const next = jest.fn();

      await syncUser(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Data saved to database",
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("does not call res.status on success (uses 200 implicitly)", async () => {
      authService.create.mockResolvedValueOnce(undefined);
      const req = makeReq({ body: {} });
      const res = makeRes();

      await syncUser(req, res, jest.fn());

      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    test("calls next(err) when authService.create throws", async () => {
      const error = new Error("DB connection failed");
      authService.create.mockRejectedValueOnce(error);
      const req = makeReq({ body: {} });
      const res = makeRes();
      const next = jest.fn();

      await syncUser(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.json).not.toHaveBeenCalled();
    });

    test("does not call res.json when an error is forwarded to next", async () => {
      authService.create.mockRejectedValueOnce(new Error("fail"));
      const req = makeReq({ body: {} });
      const res = makeRes();
      const next = jest.fn();

      await syncUser(req, res, next);

      expect(res.json).not.toHaveBeenCalled();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// updateRole
// ─────────────────────────────────────────────────────────────────────────────
describe("updateRole", () => {
  describe("authorization", () => {
    test("returns 401 when secret header is missing", async () => {
      const req = {
        headers: {},
        body: { auth0Id: "auth0|abc", role: "admin" },
      };
      const res = makeRes();
      const next = jest.fn();

      await updateRole(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
      expect(authService.updateRole).not.toHaveBeenCalled();
    });

    test("returns 401 when secret header is wrong", async () => {
      const req = makeReq({
        secret: "bad-secret",
        body: { auth0Id: "auth0|abc", role: "admin" },
      });
      const res = makeRes();
      const next = jest.fn();

      await updateRole(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
      expect(authService.updateRole).not.toHaveBeenCalled();
    });
  });

  describe("success", () => {
    test("calls authService.updateRole with auth0Id and role from body", async () => {
      authService.updateRole.mockResolvedValueOnce(undefined);
      const req = makeReq({ body: { auth0Id: "auth0|abc", role: "admin" } });
      const res = makeRes();
      const next = jest.fn();

      await updateRole(req, res, next);

      expect(authService.updateRole).toHaveBeenCalledTimes(1);
      expect(authService.updateRole).toHaveBeenCalledWith("auth0|abc", "admin");
    });

    test("responds with success JSON on valid request", async () => {
      authService.updateRole.mockResolvedValueOnce(undefined);
      const req = makeReq({ body: { auth0Id: "auth0|abc", role: "user" } });
      const res = makeRes();
      const next = jest.fn();

      await updateRole(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Data saved to database",
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("does not call res.status on success", async () => {
      authService.updateRole.mockResolvedValueOnce(undefined);
      const req = makeReq({ body: { auth0Id: "auth0|abc", role: "user" } });
      const res = makeRes();

      await updateRole(req, res, jest.fn());

      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    test("calls next(err) when authService.updateRole throws", async () => {
      const error = new Error("role update failed");
      authService.updateRole.mockRejectedValueOnce(error);
      const req = makeReq({ body: { auth0Id: "auth0|abc", role: "admin" } });
      const res = makeRes();
      const next = jest.fn();

      await updateRole(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.json).not.toHaveBeenCalled();
    });

    test("does not call res.json when error is forwarded to next", async () => {
      authService.updateRole.mockRejectedValueOnce(new Error("fail"));
      const req = makeReq({ body: { auth0Id: "auth0|abc", role: "admin" } });
      const res = makeRes();
      const next = jest.fn();

      await updateRole(req, res, next);

      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
