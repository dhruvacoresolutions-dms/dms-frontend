import path from "node:path"
import nextEnv from "@next/env"
import { defineConfig, devices } from "@playwright/test"

// Load .env / .env.local so E2E_USERNAME, E2E_PASSWORD and NEXT_PUBLIC_API_URL
// are available to the setup project and the API seeding helpers.
nextEnv.loadEnvConfig(process.cwd())

const AUTH_FILE = path.resolve(process.cwd(), "tests/e2e/.auth/user.json")
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000"

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
  },
  projects: [
    // Refreshes tests/e2e/.auth/user.json when E2E_USERNAME/E2E_PASSWORD are set.
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: AUTH_FILE },
      dependencies: ["setup"],
    },
  ],
  webServer: process.env.E2E_NO_WEBSERVER
    ? undefined
    : {
        command: "npm run dev",
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
