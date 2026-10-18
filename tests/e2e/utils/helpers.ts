import { expect, type Locator, type Page } from "@playwright/test"

/**
 * Unique, traceable identifier so test data is easy to spot in staging.
 * Product codes must contain only letters and numbers (backend rule), so any
 * separators in `prefix` are stripped.
 */
export function uniqueCode(prefix = "E2E"): string {
  const stamp = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${prefix}${stamp}${rand}`.replace(/[^A-Za-z0-9]/g, "")
}

/**
 * Navigate and wait for the app to settle. Next.js renders server markup before
 * React hydrates, so clicking too early lands on a not-yet-interactive form.
 */
export async function gotoApp(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await page.waitForLoadState("networkidle")
}

/** Text inputs have no htmlFor, so target them by their generated placeholder. */
export function fieldByLabel(scope: Page | Locator, label: string): Locator {
  const clean = label.replace(/\s*\*\s*$/, "").trim().toLowerCase()
  return scope.getByPlaceholder(`Enter ${clean}`)
}

/**
 * Creates a product through the 3-step wizard and returns its uuid.
 * The wizard only requires Code + Name (step 1); later steps are optional.
 */
export async function createProduct(
  page: Page,
  opts: { code: string; name: string }
): Promise<string> {
  await gotoApp(page, "/products/new")

  await expect(
    page.getByRole("heading", { name: "Basic Information" })
  ).toBeVisible()
  await page.getByPlaceholder("Enter code").fill(opts.code)
  await page.getByPlaceholder("Enter name").fill(opts.name)

  // `exact` avoids colliding with the "Open Next.js Dev Tools" button in dev.
  const next = page.getByRole("button", { name: "Next", exact: true })

  await next.click()
  await expect(
    page.getByRole("heading", { name: "Units & Weight" })
  ).toBeVisible()

  await next.click()
  await expect(
    page.getByRole("heading", { name: "Automotive Details" })
  ).toBeVisible()

  await page.getByRole("button", { name: "Create product" }).click()
  await page.waitForURL(/\/products\/[0-9a-f-]{36}$/)
  return page.url().split("/").pop() as string
}

/**
 * Opens a Base UI combobox, picks its first option, and returns its label.
 * Options render in a portal, so they are queried from `page`, not `scope`.
 */
export async function pickFirstOption(
  page: Page,
  combobox: Locator
): Promise<string> {
  await combobox.click()
  const option = page.getByRole("option").first()
  await expect(option).toBeVisible()
  const label = ((await option.textContent()) ?? "").trim()
  await option.click()
  return label
}
