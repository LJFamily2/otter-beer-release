import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // Path to your Next.js app (for loading next.config.ts and .env files)
  dir: "./",
});

const config: Config = {
  displayName: "unit & integration",

  // Use jsdom for component tests
  testEnvironment: "jest-environment-jsdom",

  // Setup file runs after the test framework is installed in the environment
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  // Module name mapper for @/* path aliases
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // Only run unit and integration tests (Playwright E2E uses playwright.config.ts)
  testMatch: [
    "<rootDir>/tests/unit/**/*.test.ts",
    "<rootDir>/tests/unit/**/*.test.tsx",
    "<rootDir>/tests/integration/**/*.test.ts",
  ],

  // Coverage settings for unit and integration logic
  collectCoverageFrom: [
    "src/lib/utils/**/*.ts",
    "src/lib/auth/**/*.ts",
    "src/lib/validation/**/*.ts",
    "src/services/**/*.ts",
    "src/config/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/index.ts",
  ],

  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30,
    },
  },

  coverageReporters: ["text", "lcov", "html"],
};

// bson (a mongodb/mongoose dependency) ships an ESM-only build; Jest's
// default ignores all of node_modules for transform, so `require()`-ing it
// directly threw "Unexpected token 'export'" — but only in test files that
// happened to be the first in their worker to touch the mongoose -> mongodb
// -> bson chain, since a prior successful require in the same worker could
// otherwise leave a transformed/cached copy behind. next/jest computes its
// own pnpm-aware transformIgnorePatterns and fully overwrites whatever's
// passed into `config` above (confirmed via `jest --showConfig`), so the fix
// has to patch the already-resolved patterns after the fact — splicing
// "bson" into the same whitelist next/jest already carves out for `geist`
// rather than adding an independent pattern (transformIgnorePatterns entries
// are OR'd for exclusion, so a second pattern can't "un-ignore" what the
// first already matches).
async function resolveJestConfig() {
  const resolved = await createJestConfig(config)();
  return {
    ...resolved,
    transformIgnorePatterns: (resolved.transformIgnorePatterns ?? []).map((pattern) =>
      pattern.replace(/geist/g, "geist|bson")
    ),
  };
}

export default resolveJestConfig;
