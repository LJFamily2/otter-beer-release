import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E test configuration.
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",

  // Timeout for each test in milliseconds (60s for cold compile overhead)
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if test.only is left
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 1 : 0,

  // Parallel workers — cap at 2 on CI to avoid CPU contention timeouts on GitHub Actions runners
  workers: process.env.CI ? 2 : 4,


  // Reporter
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["html", { open: "on-failure" }], ["list"]],

  // Global settings for all tests
  use: {
    // Base URL for all page.goto() calls
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",

    // Record traces on first retry (for debugging CI failures)
    trace: "on-first-retry",

    // Screenshot on failure
    screenshot: "only-on-failure",

    // Video on failure
    video: "retain-on-failure",

    // Locale for Vietnamese default
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh",

    // Pre-set age verification cookie and localStorage for all E2E tests so tests are not blocked by the Age Gate
    storageState: {
      cookies: [
        {
          name: "otter_age_verified",
          value: "true",
          domain: "localhost",
          path: "/",
          expires: Math.round(Date.now() / 1000) + 86400 * 30, // 30 days
          httpOnly: false,
          secure: false,
          sameSite: "Lax",
        },
        {
          name: "otter_age_verified",
          value: "true",
          domain: "127.0.0.1",
          path: "/",
          expires: Math.round(Date.now() / 1000) + 86400 * 30, // 30 days
          httpOnly: false,
          secure: false,
          sameSite: "Lax",
        },
      ],
      origins: [
        {
          origin: "http://localhost:3000",
          localStorage: [
            {
              name: "otter_age_verified",
              value: "true",
            },
          ],
        },
        {
          origin: "http://127.0.0.1:3000",
          localStorage: [
            {
              name: "otter_age_verified",
              value: "true",
            },
          ],
        },
      ],
    },
  },

  // Test projects — browser configurations
  projects: [
    // ─── Setup project (auth state) ──────────────────────────
    {
      name: "setup",
      testMatch: "**/e2e/setup/*.ts",
    },

    // ─── Main browser: Chromium ───────────────────────────────
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },

    // ─── Mobile viewport ──────────────────────────────────────
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
      dependencies: ["setup"],
    },

    // ─── Uncomment to add Firefox and Safari ──────────────────
    // { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    // { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],

  // Start the Next.js dev server automatically before tests
  webServer: {
    command: process.env.CI ? "pnpm run start" : "pnpm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
    stderr: "pipe",
    timeout: 180_000,
  },
});
