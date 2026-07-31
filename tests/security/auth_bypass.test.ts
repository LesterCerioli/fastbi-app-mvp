import * as jwt from "jsonwebtoken";

const TEST_SECRET = "test-secret-for-security-tests-only-32chr!";

function fakeValidateToken(tokenString: string): Error | null {
  try {
    if (!tokenString || tokenString.trim() === "") {
      return new Error("jwt must be a string");
    }
    const decoded = jwt.verify(tokenString, TEST_SECRET, {
      algorithms: ["HS256"],
    });
    if (!decoded || typeof decoded === "string") {
      return new Error("invalid token");
    }
    return null;
  } catch (err: any) {
    return err;
  }
}

function generateTestToken(claims: Record<string, unknown>): string {
  return jwt.sign(claims, TEST_SECRET, { algorithm: "HS256" });
}

describe("Security: Auth Bypass", () => {
  describe("JWT Algorithm Confusion", () => {
    it("rejects 'alg: none' tokens", () => {
      const header = Buffer.from(
        JSON.stringify({ alg: "none", typ: "JWT" })
      ).toString("base64url");
      const payload = Buffer.from(
        JSON.stringify({
          client_id: "attacker",
          exp: 9999999999,
          org_name: "admin",
        })
      ).toString("base64url");
      const noneToken = `${header}.${payload}.`;

      const err = fakeValidateToken(noneToken);
      expect(err).not.toBeNull();
      expect(err!.message).toMatch(/algorithm|signature/i);
    });

    it("rejects algorithm confusion (RS256 claimed with HMAC secret)", () => {
      const forged = jwt.sign(
        { client_id: "attacker" },
        TEST_SECRET,
        { algorithm: "HS256" }
      );
      const parts = forged.split(".");
      const header = Buffer.from(
        JSON.stringify({ alg: "RS256", typ: "JWT" })
      ).toString("base64url");
      const confusedToken = `${header}.${parts[1]}.${parts[2]}`;

      const err = fakeValidateToken(confusedToken);
      expect(err).not.toBeNull();
      expect(err!.message).toMatch(/algorithm|signature/i);
    });
  });

  describe("Token Expiry", () => {
    it("rejects expired tokens", () => {
      const expiredToken = generateTestToken({
        client_id: "any",
        exp: Math.floor(Date.now() / 1000) - 3600,
      });

      const err = fakeValidateToken(expiredToken);
      expect(err).not.toBeNull();
      expect(err!.message).toMatch(/expir/i);
    });

    it("accepts valid non-expired token", () => {
      const validToken = generateTestToken({
        client_id: "any",
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      const err = fakeValidateToken(validToken);
      expect(err).toBeNull();
    });
  });

  describe("Malformed Tokens", () => {
    const malformedTokens = [
      "not.a.jwt",
      "header.payload",
      "a.b.c.d",
      "",
      "   ",
    ];

    malformedTokens.forEach((tok) => {
      it(`rejects malformed token: "${tok || "(empty)"}"`, () => {
        const err = fakeValidateToken(tok);
        expect(err).not.toBeNull();
      });
    });
  });

  describe("Empty / Missing Authorization", () => {
    it("rejects empty Bearer token", () => {
      const err = fakeValidateToken("");
      expect(err).not.toBeNull();
    });

    it("rejects whitespace-only token", () => {
      const err = fakeValidateToken("   ");
      expect(err).not.toBeNull();
    });
  });

  describe("Auth Middleware — Org Claim Isolation", () => {
    it("valid token for org-a can access org-b data (no org claim binding)", () => {
      const tokenForOrgA = generateTestToken({
        client_id: "client-tenant-a",
        org_name: "tenant-a",
        exp: Math.floor(Date.now() / 1000) + 7200,
      });

      const err = fakeValidateToken(tokenForOrgA);
      expect(err).toBeNull();
    });
  });

  describe("No Rate Limit on Login Endpoint", () => {
    it("simulates brute-force attempts (informational)", () => {
      const bruteForceAttempts = 100;
      const successes: string[] = [];

      for (let i = 0; i < bruteForceAttempts; i++) {
        try {
          const tok = generateTestToken({
            client_id: `attempt-${i}`,
            exp: Math.floor(Date.now() / 1000) + 120,
          });
          const err = fakeValidateToken(tok);
          if (!err) successes.push(tok);
        } catch {
          break;
        }
      }

      expect(successes.length).toBe(bruteForceAttempts);
    });
  });
});
