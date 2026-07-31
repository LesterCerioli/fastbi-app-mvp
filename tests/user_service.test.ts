import { jest } from "@jest/globals";

jest.mock("../src/services/db", () => ({ query: jest.fn(), queryTx: jest.fn() }));
jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
  compareSync: jest.fn(),
}));

import bcrypt from "bcryptjs";
import { query } from "../src/services/db";
import { UserService } from "../src/services/users/user_service";
import { EmailSenderService } from "../src/services/email_sender_service";

const mockQuery = query as jest.Mock;
const mockHash = bcrypt.hash as jest.Mock;
const mockCompareSync = bcrypt.compareSync as jest.Mock;

describe("UserService", () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService();
    jest.clearAllMocks();
  });

  describe("hashPassword", () => {
    it("hashes password with bcrypt", async () => {
      mockHash.mockResolvedValue("hashed-pwd" as never);
      const result = await service.hashPassword("mypassword");
      expect(result).toBe("hashed-pwd");
      expect(mockHash).toHaveBeenCalledWith("mypassword", 10);
    });

    it("rejects on hash failure", async () => {
      mockHash.mockRejectedValue(new Error("hash failed") as never);
      await expect(service.hashPassword("pwd")).rejects.toThrow("hash failed");
    });

    it("handles empty password", async () => {
      mockHash.mockResolvedValue("" as never);
      const result = await service.hashPassword("");
      expect(result).toBe("");
    });

    it("handles special characters", async () => {
      mockHash.mockResolvedValue("hashed-special" as never);
      const result = await service.hashPassword("p@$$w0rd!<>\n");
      expect(result).toBe("hashed-special");
    });
  });

  describe("verifyPassword", () => {
    it("returns true for matching password", () => {
      mockCompareSync.mockReturnValue(true);
      expect(service.verifyPassword("plain", "hashed")).toBe(true);
    });

    it("returns false for non-matching password", () => {
      mockCompareSync.mockReturnValue(false);
      expect(service.verifyPassword("wrong", "hashed")).toBe(false);
    });

    it("handles empty strings", () => {
      mockCompareSync.mockReturnValue(false);
      expect(service.verifyPassword("", "")).toBe(false);
    });

    it("delegates to bcrypt compareSync", () => {
      mockCompareSync.mockReturnValue(true);
      service.verifyPassword("test", "hash");
      expect(mockCompareSync).toHaveBeenCalledWith("test", "hash");
    });
  });

  describe("getOrganizationIdByName", () => {
    it("returns org ID when found via ILIKE", async () => {
      mockQuery.mockResolvedValue({ rows: [{ id: "org1" }] } as never);
      const result = await service.getOrganizationIdByName("MyOrg");
      expect(result).toBe("org1");
    });

    it("returns null when not found", async () => {
      mockQuery.mockResolvedValue({ rows: [] } as never);
      const result = await service.getOrganizationIdByName("Unknown");
      expect(result).toBeNull();
    });

    it("rejects on db failure", async () => {
      mockQuery.mockRejectedValue(new Error("db error") as never);
      await expect(service.getOrganizationIdByName("Org")).rejects.toThrow("db error");
    });

    it("handles case-insensitive search", async () => {
      mockQuery.mockResolvedValue({ rows: [{ id: "org1" }] } as never);
      const result = await service.getOrganizationIdByName("myorg");
      expect(result).toBe("org1");
    });
  });

  describe("getOrganizationIdExact", () => {
    it("returns org ID on exact match", async () => {
      mockQuery.mockResolvedValue({ rows: [{ id: "org1" }] } as never);
      const result = await service.getOrganizationIdExact("Org");
      expect(result).toBe("org1");
    });

    it("returns null when no exact match", async () => {
      mockQuery.mockResolvedValue({ rows: [] } as never);
      const result = await service.getOrganizationIdExact("Missing");
      expect(result).toBeNull();
    });

    it("rejects on db failure", async () => {
      mockQuery.mockRejectedValue(new Error("err") as never);
      await expect(service.getOrganizationIdExact("Org")).rejects.toThrow("err");
    });

    it("uses exact equality in query", async () => {
      mockQuery.mockResolvedValue({ rows: [{ id: "org1" }] } as never);
      await service.getOrganizationIdExact("Org");
      expect(mockQuery.mock.calls[0][0]).toContain("= $1");
    });
  });

  describe("getOrganizationIdTrim", () => {
    it("returns org ID with trimmed match", async () => {
      mockQuery.mockResolvedValue({ rows: [{ id: "org1" }] } as never);
      const result = await service.getOrganizationIdTrim(" Org ");
      expect(result).toBe("org1");
    });

    it("returns null when no match", async () => {
      mockQuery.mockResolvedValue({ rows: [] } as never);
      const result = await service.getOrganizationIdTrim("Missing");
      expect(result).toBeNull();
    });

    it("rejects on db failure", async () => {
      mockQuery.mockRejectedValue(new Error("err") as never);
      await expect(service.getOrganizationIdTrim("Org")).rejects.toThrow("err");
    });

    it("uses TRIM in query", async () => {
      mockQuery.mockResolvedValue({ rows: [{ id: "org1" }] } as never);
      await service.getOrganizationIdTrim("Org");
      expect(mockQuery.mock.calls[0][0]).toContain("TRIM");
    });
  });

  describe("getAllOrganizations", () => {
    it("returns all organizations", async () => {
      mockQuery.mockResolvedValue({
        rows: [{ id: "1", name: "Org1" }, { id: "2", name: "Org2" }],
      } as never);
      const result = await service.getAllOrganizations();
      expect(result).toHaveLength(2);
    });

    it("returns empty array when no orgs exist", async () => {
      mockQuery.mockResolvedValue({ rows: [] } as never);
      const result = await service.getAllOrganizations();
      expect(result).toEqual([]);
    });

    it("rejects on db failure", async () => {
      mockQuery.mockRejectedValue(new Error("err") as never);
      await expect(service.getAllOrganizations()).rejects.toThrow("err");
    });

    it("selects id and name columns", async () => {
      mockQuery.mockResolvedValue({ rows: [] } as never);
      await service.getAllOrganizations();
      expect(mockQuery.mock.calls[0][0]).toContain("SELECT id, name");
    });
  });

  describe("organizationExists", () => {
    it("returns true when org exists", async () => {
      mockQuery.mockResolvedValue({ rows: [{ exists: true }] } as never);
      const result = await service.organizationExists("Org");
      expect(result).toBe(true);
    });

    it("returns false when org does not exist", async () => {
      mockQuery.mockResolvedValue({ rows: [{ exists: false }] } as never);
      const result = await service.organizationExists("Missing");
      expect(result).toBe(false);
    });

    it("returns false when result has no exists field", async () => {
      mockQuery.mockResolvedValue({ rows: [{}] } as never);
      const result = await service.organizationExists("Org");
      expect(result).toBe(false);
    });

    it("rejects on db failure", async () => {
      mockQuery.mockRejectedValue(new Error("db error") as never);
      await expect(service.organizationExists("Org")).rejects.toThrow("db error");
    });
  });

  describe("createUser", () => {
    it("creates user successfully and sends email", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "o1", name: "Org1" }, { id: "o2", name: "Org2" }] } as never);
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "o1" }] } as never);
      mockHash.mockResolvedValue("hashed" as never);
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: "u1", name: "John", email: "john@test.com", role: "admin", created_at: new Date() }],
      } as never);
      const mockEmailSender = { sendUserCredentials: jest.fn() };
      service = new UserService(mockEmailSender as unknown as EmailSenderService);
      const result = await service.createUser("John", "john@test.com", "password", "admin", "Org1");
      expect(result.id).toBe("u1");
      expect(mockEmailSender.sendUserCredentials).toHaveBeenCalled();
    });

    it("creates user without email sender", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "o1", name: "Org1" }] } as never);
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "o1" }] } as never);
      mockHash.mockResolvedValue("hashed" as never);
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: "u1", name: "John", email: "john@test.com", role: "admin", created_at: new Date() }],
      } as never);
      const result = await service.createUser("John", "john@test.com", "password", "admin", "Org1");
      expect(result.id).toBe("u1");
    });

    it("tries exact match first, then trim, then ILIKE", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "o1", name: "Org1" }] } as never);
      mockQuery.mockResolvedValueOnce({ rows: [] } as never);
      mockQuery.mockResolvedValueOnce({ rows: [] } as never);
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "o1" }] } as never);
      mockHash.mockResolvedValue("hashed" as never);
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: "u1", name: "John", email: "john@test.com", role: "admin", created_at: new Date() }],
      } as never);
      const result = await service.createUser("John", "john@test.com", "password", "admin", "Org1");
      expect(result).toBeDefined();
    });

    it("throws when org not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as never);
      mockQuery.mockResolvedValueOnce({ rows: [] } as never);
      mockQuery.mockResolvedValueOnce({ rows: [] } as never);
      mockQuery.mockResolvedValueOnce({ rows: [] } as never);
      await expect(
        service.createUser("John", "john@test.com", "password", "admin", "Unknown")
      ).rejects.toThrow("Organization 'Unknown' not found");
    });

    it("rejects on db failure during insert", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "o1", name: "Org1" }] } as never);
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "o1" }] } as never);
      mockHash.mockResolvedValue("hashed" as never);
      mockQuery.mockRejectedValueOnce(new Error("insert failed") as never);
      await expect(
        service.createUser("John", "john@test.com", "password", "admin", "Org1")
      ).rejects.toThrow("insert failed");
    });

    it("rejects when hash fails", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "o1", name: "Org1" }] } as never);
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "o1" }] } as never);
      mockHash.mockRejectedValue(new Error("hash failed") as never);
      await expect(
        service.createUser("John", "john@test.com", "password", "admin", "Org1")
      ).rejects.toThrow("hash failed");
    });

    it("returns user without password field", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "o1", name: "Org1" }] } as never);
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "o1" }] } as never);
      mockHash.mockResolvedValue("hashed" as never);
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: "u1", name: "John", email: "j@t.com", role: "user", created_at: new Date() }],
      } as never);
      const result = await service.createUser("John", "j@t.com", "pwd", "user", "Org1");
      expect(result.password).toBeUndefined();
    });
  });

  describe("updateUser", () => {
    it("updates user name", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: "u1", name: "NewName", email: "e@t.com", role: "admin", organization_id: "o1", created_at: new Date(), updated_at: new Date() }],
      } as never);
      const result = await service.updateUser("u1", "NewName");
      expect(result.name).toBe("NewName");
    });

    it("updates user role", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: "u1", name: "John", email: "e@t.com", role: "manager", organization_id: "o1", created_at: new Date(), updated_at: new Date() }],
      } as never);
      const result = await service.updateUser("u1", undefined, "manager");
      expect(result.role).toBe("manager");
    });

    it("updates both name and role", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: "u1", name: "Jane", email: "e@t.com", role: "admin", organization_id: "o1", created_at: new Date(), updated_at: new Date() }],
      } as never);
      const result = await service.updateUser("u1", "Jane", "admin");
      expect(result.name).toBe("Jane");
      expect(result.role).toBe("admin");
    });

    it("returns full user record without password", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: "u1", name: "John", email: "e@t.com", role: "user", organization_id: "o1", created_at: new Date(), updated_at: new Date() }],
      } as never);
      const result = await service.updateUser("u1", "John");
      expect(result.password).toBeUndefined();
    });

    it("throws when no fields to update", async () => {
      await expect(service.updateUser("u1")).rejects.toThrow("no fields to update");
    });

    it("throws when user not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as never);
      await expect(service.updateUser("invalid", "Name")).rejects.toThrow("user not found");
    });

    it("rejects on db failure", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db error") as never);
      await expect(service.updateUser("u1", "Name")).rejects.toThrow("db error");
    });

    it("rejects for empty userID", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as never);
      await expect(service.updateUser("", "Name")).rejects.toThrow("user not found");
    });
  });

  describe("deleteUser", () => {
    it("soft-deletes user successfully", async () => {
      mockQuery.mockResolvedValue({ rows: [{ id: "u1" }] } as never);
      const result = await service.deleteUser("u1");
      expect(result).toBe(true);
    });

    it("returns false when user not found", async () => {
      mockQuery.mockResolvedValue({ rows: [] } as never);
      const result = await service.deleteUser("invalid");
      expect(result).toBe(false);
    });

    it("rejects on db failure", async () => {
      mockQuery.mockRejectedValue(new Error("db error") as never);
      await expect(service.deleteUser("u1")).rejects.toThrow("db error");
    });

    it("returns false for already deleted user", async () => {
      mockQuery.mockResolvedValue({ rows: [] } as never);
      const result = await service.deleteUser("already_deleted");
      expect(result).toBe(false);
    });
  });

  describe("resetPasswordDirect", () => {
    it("resets password and sends email", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "u1", name: "John" }] } as never);
      mockHash.mockResolvedValue("new-hash" as never);
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "u1" }] } as never);
      const mockEmailSender = { sendPasswordReset: jest.fn() };
      service = new UserService(mockEmailSender as unknown as EmailSenderService);
      const result = await service.resetPasswordDirect("john@test.com", "newpwd");
      expect(result).toBe(true);
      expect(mockEmailSender.sendPasswordReset).toHaveBeenCalled();
    });

    it("throws when user not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as never);
      await expect(service.resetPasswordDirect("missing@test.com", "pwd")).rejects.toThrow(
        "user not found"
      );
    });

    it("throws when update fails", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "u1", name: "John" }] } as never);
      mockHash.mockResolvedValue("hash" as never);
      mockQuery.mockResolvedValueOnce({ rows: [] } as never);
      await expect(service.resetPasswordDirect("john@test.com", "pwd")).rejects.toThrow(
        "failed to update password"
      );
    });

    it("resets without email sender", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "u1", name: "John" }] } as never);
      mockHash.mockResolvedValue("hash" as never);
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "u1" }] } as never);
      const result = await service.resetPasswordDirect("john@test.com", "pwd");
      expect(result).toBe(true);
    });
  });

  describe("changePassword", () => {
    it("changes password with valid old password", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ email: "e@t.com", name: "John", password: "old-hash" }],
      } as never);
      mockCompareSync.mockReturnValueOnce(true);
      mockHash.mockResolvedValue("new-hash" as never);
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "u1" }] } as never);
      const result = await service.changePassword("u1", "old", "new");
      expect(result).toBe(true);
    });

    it("throws when user not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as never);
      await expect(service.changePassword("invalid", "old", "new")).rejects.toThrow(
        "user not found"
      );
    });

    it("throws when old password is invalid", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ email: "e@t.com", name: "John", password: "hash" }],
      } as never);
      mockCompareSync.mockReturnValueOnce(false);
      await expect(service.changePassword("u1", "wrong", "new")).rejects.toThrow(
        "invalid current password"
      );
    });

    it("rejects on db failure", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db error") as never);
      await expect(service.changePassword("u1", "old", "new")).rejects.toThrow("db error");
    });
  });
});
