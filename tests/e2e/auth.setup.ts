import fs from "node:fs"
import path from "node:path"
import { test as setup } from "@playwright/test"

const AUTH_FILE = path.resolve(process.cwd(), "tests/e2e/.auth/user.json")

/**
 * Ensures tests/e2e/.auth/user.json exists.
 *
 * - With E2E_USERNAME + E2E_PASSWORD set, logs in through the UI and saves a
 *   fresh storage state (recommended; tokens expire after ~30 minutes).
 * - Without credentials, falls back to the committed/current auth state.
 */
setup("authenticate", async ({ page }) => {
  const username = process.env.E2E_USERNAME
  const password = process.env.E2E_PASSWORD

  if (!username || !password) {
    if (!fs.existsSync(AUTH_FILE)) {
      throw new Error(
        "No auth state found. Set E2E_USERNAME and E2E_PASSWORD, or provide " +
          "tests/e2e/.auth/user.json. See tests/e2e/README.md."
      )
    }
    setup.skip(true, "Using existing tests/e2e/.auth/user.json (no E2E credentials set)")
    return
  }

  await page.goto("/auth/login")
  // Placeholders are used because the password field also has a "Show password"
  // button, which makes `getByLabel("Password")` ambiguous.
  await page.getByPlaceholder("Enter your username").fill(username)
  await page.getByPlaceholder("Enter your password").fill(password)
  await page.getByRole("button", { name: "Login" }).click()
  await page.waitForURL("**/dashboard", { timeout: 30_000 })

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true })
  await page.context().storageState({ path: AUTH_FILE })
})
