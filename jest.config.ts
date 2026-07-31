import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  setupFiles: ["<rootDir>/tests/helpers/setup.ts"],
  moduleNameMapper: {
    "^@/services/(.*)$": "<rootDir>/src/services/$1",
  },
};

export default config;
