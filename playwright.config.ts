import { defineConfig, devices } from "@playwright/test";

import { config } from "./src/config/environment";

export default defineConfig({
  testDir: "./tests",
  timeout: 10_000,
  fullyParallel: true,
  retries: config.isCI ? 3 : 0,
  reporter: config.isCI
    ? [["github"], ["html", { open: "never" }]]
    : [["html", { open: "never" }]],
  use: {
    trace: "retain-on-failure",
    baseURL: config.BASE_URL,
  },

  projects: [
    // Setup project for authentication
    {
      name: "setup",
      testMatch: /.*rolnopol\/ui\/auth\/setup\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },

    // Smoke tests - fast checks without authentication
    {
      name: "smoke-tests",
      testMatch: /.*rolnopol\/ui\/main\.smoke\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },

    // Playwright CLI tests - new test suite using Playwright CLI
    {
      name: "playwright-cli",
      testMatch: /.*rolnopol\/ui-cli\/.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },

    // API tests - direct HTTP requests, no browser needed
    {
      name: "api-tests",
      testMatch: /.*rolnopol\/api\/.*\.spec\.ts/,
      use: { baseURL: config.BASE_URL },
    },

    // Bystre API tests use their own app-scoped base URL and credentials.
    {
      name: "bystre-api-tests",
      testMatch: /.*bystre\/api\/.*\.api\.spec\.ts/,
      grepInvert: /@bystre-admin/,
      use: { baseURL: config.BYSTRE_API_BASE_URL },
    },

    {
      name: "bystre-admin-api-tests",
      testMatch: /.*bystre\/api\/.*\.api\.spec\.ts/,
      grep: /@bystre-admin/,
      use: { baseURL: config.BYSTRE_ADMIN_API_BASE_URL },
    },

    // Authenticated tests that mutate data - must finish before the demo user logs out
    {
      name: "authenticated-fields",
      testMatch: /.*rolnopol\/ui\/authenticated\/fields\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
    },

    // Authenticated tests that end with logout - runs after setup
    // Demo-user tests can run independently without being blocked by authenticated-fields failures
    {
      name: "authenticated-profile",
      testMatch: /.*rolnopol\/ui\/authenticated\/demo-user\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
});
