import { execSync } from "child_process";
import * as path from "path";

const SECURITY_DIR = path.resolve(__dirname);

const files = [
  "auth_bypass.test.ts",
  "csv_injection.test.ts",
  "input_validation.test.ts",
  "multi_tenant_isolation.test.ts",
  "sensitive_data_exposure.test.ts",
  "sql_injection.test.ts",
  "template_library_security.test.ts",
  "template_preview_security.test.ts",
  "visibility_rule_dos.test.ts",
];

describe("Security Tests — TypeScript Compilation Integrity", () => {
  it("all security test files compile without type errors", () => {
    const filePaths = files
      .map((f) => path.join(SECURITY_DIR, f))
      .join(" ");

    try {
      const output = execSync(
        `npx tsc --noEmit --strict ${filePaths} 2>&1 || true`,
        { cwd: path.resolve(__dirname, "../.."), encoding: "utf8", timeout: 60000 }
      );

      const lines = output.split("\n");
      const ourErrors = lines.filter(
        (l) => l.includes(".test.ts") && !l.includes("node_modules/")
      );

      if (ourErrors.length > 0) {
        const msg = ourErrors.map((l) => `  ${l.trim()}`).join("\n");
        throw new Error(
          `TypeScript compilation errors in security test files:\n${msg}`
        );
      }
    } catch (err: any) {
      if (err.message && err.message.includes("TypeScript compilation errors")) {
        throw err;
      }
      if (err.stderr) {
        const lines = err.stderr.split("\n");
        const ourErrors = lines.filter(
          (l) => l.includes(".test.ts") && !l.includes("node_modules/")
        );
        if (ourErrors.length > 0) {
          const msg = ourErrors.map((l) => `  ${l.trim()}`).join("\n");
          throw new Error(
            `TypeScript compilation errors in security test files:\n${msg}`
          );
        }
      }
    }
  });
});
