import { jest } from "@jest/globals";
jest.mock("../src/services/db", () => ({
  query: jest.fn(),
  queryTx: jest.fn(),
}));
jest.mock("uuid", () => ({
  v4: jest.fn(() => "mock-uuid"),
}));

import { OrganizationService, type CreateOrgDTO, type UpdateOrgDTO } from "../src/services/organization_service";
import { query, queryTx } from "../src/services/db";

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockQueryTx = queryTx as jest.MockedFunction<typeof queryTx>;

describe("OrganizationService", () => {
  let service: OrganizationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrganizationService();
  });

  describe("create", () => {
    it("creates organization and returns response", async () => {
      const now = new Date();
      mockQueryTx.mockImplementation(async (fn: any) => {
        return fn(jest.fn().mockResolvedValue({ rows: [{ id: "org-1", name: "Test Org", address: null, cnpj: null, ein: null, created_at: now, updated_at: now }] }));
      });

      const result = await service.create({ name: "Test Org" });

      expect(result.name).toBe("Test Org");
      expect(result.id).toBeDefined();
    });

    it("creates organization with optional address fields", async () => {
      const now = new Date();
      mockQueryTx.mockImplementation(async (fn: any) => {
        return fn(jest.fn().mockResolvedValue({ rows: [{ id: "org-2", name: "Full Org", address: "123 St", cnpj: null, ein: null, created_at: now, updated_at: now }] }));
      });

      const result = await service.create({ name: "Full Org", address: "123 St" });

      expect(result.address).toBe("123 St");
    });

    it("creates organization with CNPJ", async () => {
      mockQueryTx.mockImplementation(async (fn: any) => {
        const mockQ = jest.fn()
          .mockResolvedValueOnce({ rows: [] } as any)
          .mockResolvedValueOnce({ rows: [{ id: "org-3", name: "CNPJ Org", address: null, cnpj: "12345678901234", ein: null, created_at: new Date(), updated_at: new Date() }] });
        return fn(mockQ);
      });

      const result = await service.create({ name: "CNPJ Org", cnpj: "12345678901234" });

      expect(result.cnpj).toBe("12345678901234");
    });

    it("creates organization with EIN", async () => {
      mockQueryTx.mockImplementation(async (fn: any) => {
        const mockQ = jest.fn()
          .mockResolvedValueOnce({ rows: [] } as any)
          .mockResolvedValueOnce({ rows: [{ id: "org-4", name: "EIN Org", address: null, cnpj: null, ein: "987654321", created_at: new Date(), updated_at: new Date() }] });
        return fn(mockQ);
      });

      const result = await service.create({ name: "EIN Org", ein: "987654321" });

      expect(result.ein).toBe("987654321");
    });

    it("throws when name is empty", async () => {
      await expect(service.create({ name: "  " })).rejects.toThrow("organization name cannot be empty");
    });

    it("throws when CNPJ already exists", async () => {
      mockQueryTx.mockImplementation(async (fn: any) => {
        const mockQ = jest.fn().mockResolvedValueOnce({ rows: [{ id: "existing" }] } as any);
        return fn(mockQ);
      });

      await expect(service.create({ name: "Test", cnpj: "12345678901234" })).rejects.toThrow("CNPJ");
    });

    it("throws when EIN already exists", async () => {
      mockQueryTx.mockImplementation(async (fn: any) => {
        const mockQ = jest.fn()
          .mockResolvedValueOnce({ rows: [{ id: "existing" }] } as any);
        return fn(mockQ);
      });

      await expect(service.create({ name: "Test", ein: "987654321" })).rejects.toThrow("EIN");
    });

    it("propagates transaction errors", async () => {
      mockQueryTx.mockRejectedValueOnce(new Error("tx error"));

      await expect(service.create({ name: "Test" })).rejects.toThrow("tx error");
    });

    it("trims the organization name", async () => {
      mockQueryTx.mockImplementation(async (fn: any) => {
        return fn(jest.fn().mockResolvedValue({ rows: [{ id: "org-5", name: "Trimmed Org", address: null, cnpj: null, ein: null, created_at: new Date(), updated_at: new Date() }] }));
      });

      const result = await service.create({ name: "  Trimmed Org  " });

      expect(result.name).toBe("Trimmed Org");
    });
  });

  describe("getByID", () => {
    it("returns org detail with statistics when found", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1", name: "Test Org", address: null, cnpj: null, ein: null, created_at: new Date(), updated_at: new Date() }] } as any)
        .mockResolvedValueOnce({ rows: [{ count: "10" }] } as any)
        .mockResolvedValueOnce({ rows: [{ count: "5" }] } as any)
        .mockResolvedValueOnce({ rows: [{ count: "20" }] } as any)
        .mockResolvedValueOnce({ rows: [{ count: "50" }] } as any);

      const result = await service.getByID("org-1");

      expect(result).not.toBeNull();
      expect(result!.statistics.user_count).toBe(10);
    });

    it("returns null when not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.getByID("invalid-id");

      expect(result).toBeNull();
    });

    it("includes zero statistics when no related records", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1", name: "Test Org", address: null, cnpj: null, ein: null, created_at: new Date(), updated_at: new Date() }] } as any)
        .mockResolvedValueOnce({ rows: [{ count: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [{ count: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [{ count: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [{ count: "0" }] } as any);

      const result = await service.getByID("org-1");

      expect(result!.statistics).toEqual({ user_count: 0, doctor_count: 0, patient_count: 0, appointment_count: 0 });
    });

    it("propagates database errors", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db error"));

      await expect(service.getByID("org-1")).rejects.toThrow("db error");
    });
  });

  describe("update", () => {
    it("updates organization name", async () => {
      const now = new Date();
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);

      mockQueryTx.mockImplementation(async (fn: any) => {
        return fn(jest.fn().mockResolvedValue({ rows: [{ id: "org-1", name: "Updated Name", address: null, cnpj: null, ein: null, created_at: now, updated_at: now }] }));
      });

      const result = await service.update("org-1", { name: "Updated Name" });

      expect(result!.name).toBe("Updated Name");
    });

    it("returns null when organization not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.update("invalid-id", { name: "New" });

      expect(result).toBeNull();
    });

    it("returns current org when no updates provided", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: "org-1", name: "Same", address: null, cnpj: null, ein: null, created_at: new Date(), updated_at: new Date() }] } as any)
        .mockResolvedValueOnce({ rows: [{ count: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [{ count: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [{ count: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [{ count: "0" }] } as any);

      const result = await service.update("org-1", {});

      expect(result).not.toBeNull();
    });

    it("throws when CNPJ conflict exists", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);

      mockQueryTx.mockImplementation(async (fn: any) => {
        const mockQ = jest.fn().mockResolvedValueOnce({ rows: [{ id: "other-org" }] } as any);
        return fn(mockQ);
      });

      await expect(service.update("org-1", { cnpj: "12345678901234" })).rejects.toThrow("CNPJ");
    });

    it("throws when EIN conflict exists", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);

      mockQueryTx.mockImplementation(async (fn: any) => {
        const mockQ = jest.fn()
          .mockResolvedValueOnce({ rows: [{ id: "other-org" }] } as any);
        return fn(mockQ);
      });

      await expect(service.update("org-1", { ein: "987654321" })).rejects.toThrow("EIN");
    });

    it("propagates transaction errors", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
      mockQueryTx.mockRejectedValueOnce(new Error("tx error"));

      await expect(service.update("org-1", { name: "New" })).rejects.toThrow("tx error");
    });
  });

  describe("delete", () => {
    it("soft-deletes organization when no associated users/patients", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);

      mockQueryTx.mockImplementation(async (fn: any) => {
        const mockQ = jest.fn()
          .mockResolvedValueOnce({ rows: [{ count: "0" }] } as any)
          .mockResolvedValueOnce({ rows: [{ count: "0" }] } as any)
          .mockResolvedValueOnce({ rows: [] } as any);
        return fn(mockQ);
      });

      await expect(service.delete("org-1")).resolves.not.toThrow();
    });

    it("throws when organization not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      await expect(service.delete("invalid-id")).rejects.toThrow("organization with ID");
    });

    it("throws when organization has associated users", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);

      mockQueryTx.mockImplementation(async (fn: any) => {
        const mockQ = jest.fn()
          .mockResolvedValueOnce({ rows: [{ count: "3" }] } as any)
          .mockResolvedValueOnce({ rows: [{ count: "0" }] } as any);
        return fn(mockQ);
      });

      await expect(service.delete("org-1")).rejects.toThrow("cannot delete organization with associated users");
    });

    it("throws when organization has associated patients", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);

      mockQueryTx.mockImplementation(async (fn: any) => {
        const mockQ = jest.fn()
          .mockResolvedValueOnce({ rows: [{ count: "0" }] } as any)
          .mockResolvedValueOnce({ rows: [{ count: "5" }] } as any);
        return fn(mockQ);
      });

      await expect(service.delete("org-1")).rejects.toThrow("cannot delete organization with associated patients");
    });

    it("propagates transaction errors", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);
      mockQueryTx.mockRejectedValueOnce(new Error("tx error"));

      await expect(service.delete("org-1")).rejects.toThrow("tx error");
    });
  });

  describe("getByCNPJ", () => {
    it("returns org when found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1", name: "Test", address: null, cnpj: "123", ein: null, created_at: new Date(), updated_at: new Date() }] } as any);

      const result = await service.getByCNPJ("123");

      expect(result).not.toBeNull();
    });

    it("returns null when not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.getByCNPJ("nonexistent");

      expect(result).toBeNull();
    });

    it("propagates database errors", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db error"));

      await expect(service.getByCNPJ("123")).rejects.toThrow("db error");
    });
  });

  describe("getByEIN", () => {
    it("returns org when found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1", name: "Test", address: null, cnpj: null, ein: "456", created_at: new Date(), updated_at: new Date() }] } as any);

      const result = await service.getByEIN("456");

      expect(result).not.toBeNull();
    });

    it("returns null when not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.getByEIN("nonexistent");

      expect(result).toBeNull();
    });

    it("propagates database errors", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db error"));

      await expect(service.getByEIN("456")).rejects.toThrow("db error");
    });
  });

  describe("search", () => {
    it("returns paginated search results", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total: "1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: "org-1", name: "Test Org", address: null, cnpj: null, ein: null, created_at: new Date(), updated_at: new Date() }] } as any);

      const result = await service.search("Test");

      expect(result.organizations).toHaveLength(1);
      expect(result.total_count).toBe(1);
    });

    it("returns empty list when no matches", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.search("NoMatch");

      expect(result.organizations).toHaveLength(0);
    });

    it("throws when query is empty", async () => {
      await expect(service.search("  ")).rejects.toThrow("search query cannot be empty");
    });

    it("propagates database errors", async () => {
      mockQuery.mockRejectedValueOnce(new Error("db error"));

      await expect(service.search("Test")).rejects.toThrow("db error");
    });
  });

  describe("getByName", () => {
    it("returns organizations matching name", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total: "1" }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: "org-1", name: "Test Org", address: null, cnpj: null, ein: null, created_at: new Date(), updated_at: new Date() }] } as any);

      const result = await service.getByName("Test");

      expect(result.organizations).toHaveLength(1);
    });

    it("throws when name is empty", async () => {
      await expect(service.getByName("")).rejects.toThrow("organization name cannot be empty");
    });
  });

  describe("getAll", () => {
    it("returns all organizations with pagination", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total: "2" }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: "org-1", name: "A", address: null, cnpj: null, ein: null, created_at: new Date(), updated_at: new Date() }, { id: "org-2", name: "B", address: null, cnpj: null, ein: null, created_at: new Date(), updated_at: new Date() }] } as any);

      const result = await service.getAll();

      expect(result.organizations).toHaveLength(2);
      expect(result.total_count).toBe(2);
    });

    it("returns empty list when no organizations", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.getAll();

      expect(result.organizations).toHaveLength(0);
    });
  });

  describe("validateCNPJ", () => {
    it("returns valid format when 14 digits", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.validateCNPJ("12345678901234");

      expect(result.is_valid_format).toBe(true);
      expect(result.is_available).toBe(true);
    });

    it("returns invalid format when not 14 digits", async () => {
      const result = await service.validateCNPJ("123");

      expect(result.is_valid_format).toBe(false);
      expect(result.is_available).toBe(false);
    });

    it("cleans non-digit characters", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1" }] } as any);

      const result = await service.validateCNPJ("12.345.678/9012-34");

      expect(result.cleaned_cnpj).toBe("12345678901234");
      expect(result.is_available).toBe(false);
    });
  });

  describe("validateEIN", () => {
    it("returns valid format when 9 digits", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.validateEIN("123456789");

      expect(result.is_valid_format).toBe(true);
    });

    it("returns invalid format when not 9 digits", async () => {
      const result = await service.validateEIN("123");

      expect(result.is_valid_format).toBe(false);
    });

    it("cleans non-digit characters", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.validateEIN("12-3456789");

      expect(result.cleaned_ein).toBe("123456789");
    });
  });

  describe("deactivate and reactivate", () => {
    it("deactivates organization by setting deleted_at", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1", name: "Test", address: null, cnpj: null, ein: null, created_at: new Date(), updated_at: new Date() }] } as any);

      const result = await service.deactivate("org-1");

      expect(result).not.toBeNull();
    });

    it("returns null when deactivating non-existent org", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.deactivate("invalid");

      expect(result).toBeNull();
    });

    it("reactivates organization by clearing deleted_at", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "org-1", name: "Test", address: null, cnpj: null, ein: null, created_at: new Date(), updated_at: new Date() }] } as any);

      const result = await service.reactivate("org-1");

      expect(result).not.toBeNull();
    });

    it("returns null when reactivating non-existent org", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const result = await service.reactivate("invalid");

      expect(result).toBeNull();
    });
  });
});
