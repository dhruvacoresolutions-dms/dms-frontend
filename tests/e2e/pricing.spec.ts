import { test, expect, type Page } from "@playwright/test"
import {
  createProduct,
  fieldByLabel,
  pickFirstOption,
  uniqueCode,
  gotoApp,
} from "./utils/helpers"

/** Creates a product and opens its Prices tab. */
async function openPricesTab(page: Page): Promise<void> {
  const code = uniqueCode("E2E-PRC")
  await createProduct(page, { code, name: `E2E Pricing ${code}` })

  await page.getByTestId("tab-prices").click()
  await expect(page.getByTestId("add-price-btn")).toBeVisible()
}

/** Adds a price with a real price type and asserts the row appears. */
async function addPrice(page: Page, amount: string): Promise<void> {
  await page.getByTestId("add-price-btn").click()

  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()
  await pickFirstOption(page, dialog.getByRole("combobox").first())
  await fieldByLabel(dialog, "Amount").fill(amount)
  await dialog.getByRole("button", { name: "Add price" }).click()

  await expect(page.getByText("Price created")).toBeVisible()
  await expect(page.getByRole("cell", { name: amount })).toBeVisible()
}

test.describe("Product pricing", () => {
  test("shows the empty state and adds a price", async ({ page }) => {
    await openPricesTab(page)

    // A brand new product has no prices yet.
    await expect(page.getByText("No prices yet")).toBeVisible()

    await addPrice(page, "199.99")
  })

  test("requires a price type and an amount", async ({ page }) => {
    await openPricesTab(page)

    await page.getByTestId("add-price-btn").click()
    const dialog = page.getByRole("dialog")
    await dialog.getByRole("button", { name: "Add price" }).click()

    await expect(page.getByText("Price type is required")).toBeVisible()
    await expect(page.getByText("Amount is required")).toBeVisible()
    await expect(dialog).toBeVisible()
  })

  test("revises and then deactivates a price", async ({ page }) => {
    await openPricesTab(page)
    await addPrice(page, "149.75")

    // Revise the existing price.
    const row = page.getByRole("row").filter({ hasText: "149.75" })
    await row.getByRole("button").last().click()
    await page.getByRole("menuitem", { name: "Revise" }).click()

    const reviseDialog = page.getByRole("dialog")
    await expect(
      reviseDialog.getByRole("button", { name: "Revise price" })
    ).toBeVisible()
    await fieldByLabel(reviseDialog, "Amount").fill("159.75")
    await reviseDialog.getByRole("button", { name: "Revise price" }).click()
    await expect(page.getByText("Price revised")).toBeVisible()

    // Deactivate the revised price.
    const revisedRow = page.getByRole("row").filter({ hasText: "159.75" })
    await revisedRow.getByRole("button").last().click()
    await page.getByRole("menuitem", { name: "Deactivate" }).click()
    await page.getByRole("button", { name: "Deactivate" }).click()

    await expect(page.getByText("Price deactivated")).toBeVisible()
  })
})
