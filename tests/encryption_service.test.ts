import { jest } from "@jest/globals";

const ORIGINAL_ENV = process.env;

describe("EncryptionService", () => {
  let EncryptionService: typeof import("../src/services/data_engineering/encryption_service").EncryptionService;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  describe("constructor", () => {
    it("loads key from MASTER_ENCRYPTION_KEY env var", () => {
      process.env.MASTER_ENCRYPTION_KEY = Buffer.alloc(32).toString("base64");
      const { EncryptionService: ES } = require("../src/services/data_engineering/encryption_service");
      const service = new ES();
      expect(service).toBeDefined();
    });

    it("throws when MASTER_ENCRYPTION_KEY is not 32 bytes", () => {
      process.env.MASTER_ENCRYPTION_KEY = Buffer.alloc(16).toString("base64");
      const { EncryptionService: ES } = require("../src/services/data_engineering/encryption_service");
      expect(() => new ES()).toThrow("MASTER_ENCRYPTION_KEY must be 32 bytes when decoded");
    });

    it("generates random key when MASTER_ENCRYPTION_KEY is not set", () => {
      delete process.env.MASTER_ENCRYPTION_KEY;
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      const { EncryptionService: ES } = require("../src/services/data_engineering/encryption_service");
      const service = new ES();
      expect(service).toBeDefined();
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe("encrypt / decrypt", () => {
    const testCases = [
      "hello world",
      "",
      "a",
      "abc123!@#$%",
      "text with\nnewline",
      "  leading and trailing spaces  ",
      JSON.stringify({ nested: { object: true }, arr: [1, 2, 3] }),
      " ".repeat(1000),
    ];

    let service: any;

    beforeAll(() => {
      process.env.MASTER_ENCRYPTION_KEY = Buffer.alloc(32).toString("base64");
      const { EncryptionService: ES } = require("../src/services/data_engineering/encryption_service");
      service = new ES();
    });

    it.each(testCases)("encrypts and decrypts: %j", (plainText: string) => {
      const encrypted = service.encrypt(plainText);
      const decrypted = service.decrypt(encrypted);
      expect(decrypted).toBe(plainText);
    });

    it("returns empty string when encrypting empty input", () => {
      expect(service.encrypt("")).toBe("");
    });

    it("returns empty string when decrypting empty input", () => {
      expect(service.decrypt("")).toBe("");
    });

    it("produces different ciphertexts for same plaintext", () => {
      const plainText = "deterministic test";
      const result1 = service.encrypt(plainText);
      const result2 = service.encrypt(plainText);
      expect(result1).not.toBe(result2);
    });

    it("throws when decrypting tampered data", () => {
      const encrypted = service.encrypt("secret data");
      const buf = Buffer.from(encrypted, "base64");
      buf[0] ^= 0xff;
      const tampered = buf.toString("base64");
      expect(() => service.decrypt(tampered)).toThrow();
    });

    it("throws when decrypting invalid base64", () => {
      expect(() => service.decrypt("not-base64!!!")).toThrow();
    });

    it("handles very long strings", () => {
      const longText = "A".repeat(50000);
      const encrypted = service.encrypt(longText);
      const decrypted = service.decrypt(encrypted);
      expect(decrypted).toBe(longText);
    });
  });

  describe("round-trip with different keys", () => {
    it("cannot decrypt with a different key", () => {
      process.env.MASTER_ENCRYPTION_KEY = Buffer.alloc(32, 1).toString("base64");
      const { EncryptionService: ES1 } = require("../src/services/data_engineering/encryption_service");
      const service1 = new ES1();
      const encrypted = service1.encrypt("cross-key test");

      process.env.MASTER_ENCRYPTION_KEY = Buffer.alloc(32, 2).toString("base64");
      jest.resetModules();
      const { EncryptionService: ES2 } = require("../src/services/data_engineering/encryption_service");
      const service2 = new ES2();
      expect(() => service2.decrypt(encrypted)).toThrow();
    });
  });
});
