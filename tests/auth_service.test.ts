import { jest } from "@jest/globals";
import { createPgMock, resetMock, mockPoolQuery } from "./helpers/db-mock";

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(() => "mocked-jwt-token"),
  verify: jest.fn(() => ({ client_id: "test-client-id" })),
  default: { sign: jest.fn(), verify: jest.fn() },
}));

jest.mock("pg", () => createPgMock());

let generateToken: any, validateToken: any, getValidToken: any;

beforeAll(() => {
  process.env.JWT_SECRET = "a-32-byte-secret-for-testing-purposes!!";
  process.env.CLIENT_ID_1 = "test-client-id";
  process.env.SECRET_1 = "test-client-secret";
});

beforeAll(async () => {
  const mod = await import("../src/services/auth_service");
  generateToken = mod.generateToken;
  validateToken = mod.validateToken;
  getValidToken = mod.getValidToken;
});

beforeEach(() => {
  resetMock();
});

afterAll(() => {
  delete process.env.JWT_SECRET;
  delete process.env.CLIENT_ID_1;
  delete process.env.SECRET_1;
});

describe("AuthService", () => {
  describe("generateToken", () => {
    it("returns token for valid credentials", async () => {
      mockPoolQuery.mockResolvedValueOnce({ rowCount: 1 });

      const result = await generateToken("test-client-id", "test-client-secret");

      expect(result).toHaveProperty("token");
      expect(result.client_id).toBe("test-client-id");
    });

    it("persists token in database", async () => {
      let insertCalled = false;
      mockPoolQuery.mockImplementation((_text: string, _params: unknown[]) => {
        insertCalled = true;
        return Promise.resolve({ rowCount: 1 });
      });

      await generateToken("test-client-id", "test-client-secret");

      expect(insertCalled).toBe(true);
    });

    it("throws for invalid client_id", async () => {
      await expect(generateToken("wrong-id", "test-client-secret")).rejects.toThrow(
        "invalid client_id or secret",
      );
    });

    it("throws for invalid secret", async () => {
      await expect(generateToken("test-client-id", "wrong-secret")).rejects.toThrow(
        "invalid client_id or secret",
      );
    });

    it("throws when insert fails", async () => {
      mockPoolQuery.mockResolvedValueOnce({ rowCount: 0 });

      await expect(generateToken("test-client-id", "test-client-secret")).rejects.toThrow(
        "failed to persist token",
      );
    });
  });

  describe("validateToken", () => {
    it("resolves for a valid stored token", async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ exists: true }] });

      await expect(validateToken("mocked-jwt-token")).resolves.toBeUndefined();
    });

    it("rejects for non-existent token", async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ exists: false }] });

      await expect(validateToken("fake-token")).rejects.toThrow("token not found or expired");
    });
  });

  describe("getValidToken", () => {
    it("returns latest non-expired token", async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ jwt_token: "stored-token" }] });

      const result = await getValidToken("test-client-id");

      expect(result).toBe("stored-token");
    });

    it("returns null when no valid tokens exist", async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [] });

      const result = await getValidToken("test-client-id");

      expect(result).toBeNull();
    });
  });
});
