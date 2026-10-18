import { test, expect, type Page } from "@playwright/test"
import { createProduct, gotoApp, uniqueCode } from "./utils/helpers"
import { seedProduct, seedRequiredPrices } from "./utils/api"

const LIST = "/products"

/** Clicks the kebab menu of the row containing `code`. */
async function openRowMenu(page: Page, code: string) {
  const row = page.getByRole("row").filter({ hasText: code })
  await expect(row).toBeVisible()
  await row.getByRole("button").last().click()
}

async function searchFor(page: Page, term: string) {
  // The search box is debounced, so wait for the resulting list request and let
  // the table re-render before interacting with rows (otherwise the open menu is
  // detached mid-click by the refetch).
  await Promise.all([
    page.waitForResponse(
      (r) =>
        r.request().method() === "GET" &&
        r.url().includes("/products") &&
        r.url().includes("search="),
      { timeout: 15_000 }
    ),
    page.getByPlaceholder("Search products...").fill(term),
  ])
  await page.waitForLoadState("networkidle")
}

test.describe("Products page", () => {
  // ── Shell ────────────────────────────────────────────────────────────────
  test("renders the page shell, filters and table columns", async ({
    page,
    request,
  }) => {
    await seedProduct(request, {
      code: uniqueCode("E2ESHELL"),
      name: "E2E Shell Product",
    })
    await gotoApp(page, LIST)

    await expect(
      page.getByRole("heading", { name: "Products", level: 1 })
    ).toBeVisible()
    await expect(
      page.getByText("Manage product catalogue and pricing")
    ).toBeVisible()

    // Filters / actions
    await expect(page.getByPlaceholder("Search products...")).toBeVisible()
    await expect(page.getByTestId("product-category-filter")).toBeVisible()
    await expect(page.getByTestId("product-status-filter")).toBeVisible()
    await expect(page.getByRole("button", { name: "Import" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Export" })).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Create Product" }).first()
    ).toBeVisible()

    // Table columns
    for (const header of ["Code", "Name", "Category", "Type", "Status"]) {
      await expect(
        page.getByRole("columnheader", { name: header, exact: true })
      ).toBeVisible()
    }

    // Pagination footer
    await expect(page.getByText("Rows per page")).toBeVisible()
    await expect(page.getByRole("button", { name: "Previous" })).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Next", exact: true })
    ).toBeVisible()
  })

  // ── Search ───────────────────────────────────────────────────────────────
  test("search filters down to the matching product", async ({
    page,
    request,
  }) => {
    const target = uniqueCode("E2ESEARCH")
    const other = uniqueCode("E2ESEARCH")
    await seedProduct(request, { code: target, name: "E2E Search Target" })
    await seedProduct(request, { code: other, name: "E2E Search Other" })

    await gotoApp(page, LIST)
    await searchFor(page, target)

    await expect(page.getByRole("cell", { name: target, exact: true })).toBeVisible()
    await expect(
      page.getByRole("cell", { name: other, exact: true })
    ).toHaveCount(0)
  })

  test("search with no matches shows the filtered empty state", async ({
    page,
  }) => {
    await gotoApp(page, LIST)
    await searchFor(page, "ZZZNOMATCH12345")

    await expect(page.getByText("No products found")).toBeVisible()
    await expect(
      page.getByText("Try a different search or clear filters.")
    ).toBeVisible()
  })

  test("clear filters resets the search box", async ({ page }) => {
    await gotoApp(page, LIST)
    await searchFor(page, "ZZZNOMATCH12345")

    const clearButton = page.getByRole("button", { name: "Clear", exact: true })
    await expect(clearButton).toBeVisible()
    await clearButton.click()

    await expect(page.getByPlaceholder("Search products...")).toHaveValue("")
    await expect(clearButton).toHaveCount(0)
  })

  // ── Status filter ────────────────────────────────────────────────────────
  test("status filter narrows the list by lifecycle status", async ({
    page,
    request,
  }) => {
    const code = uniqueCode("E2ESTATUS")
    await seedProduct(request, { code, name: "E2E Status Draft" })

    await gotoApp(page, LIST)
    await searchFor(page, code)

    // Drafts are visible under the "Draft" filter.
    await page.getByTestId("product-status-filter").click()
    await page.getByRole("option", { name: "Draft", exact: true }).click()
    await expect(page.getByRole("cell", { name: code, exact: true })).toBeVisible()

    // ...and hidden under "Active".
    await page.getByTestId("product-status-filter").click()
    await page.getByRole("option", { name: "Active", exact: true }).click()
    await expect(
      page.getByRole("cell", { name: code, exact: true })
    ).toHaveCount(0)
  })

  // ── Pagination ───────────────────────────────────────────────────────────
  test("paginates the list forward and back", async ({ page, request }) => {
    const stamp = uniqueCode("E2EPG")
    await Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        seedProduct(request, {
          code: `${stamp}${String(i).padStart(2, "0")}`,
          name: `E2E Page ${i}`,
        })
      )
    )

    await gotoApp(page, LIST)

    await expect(page.getByText(/Page 1 of/)).toBeVisible()
    await page.getByRole("button", { name: "Next", exact: true }).click()
    await expect(page.getByText(/Page 2 of/)).toBeVisible()
    await page.getByRole("button", { name: "Previous" }).click()
    await expect(page.getByText(/Page 1 of/)).toBeVisible()
  })

  // ── Row actions ──────────────────────────────────────────────────────────
  test("row action View opens the product detail page", async ({
    page,
    request,
  }) => {
    const code = uniqueCode("E2EVIEW")
    const { productUuid } = await seedProduct(request, {
      code,
      name: "E2E View Product",
    })

    await gotoApp(page, LIST)
    await searchFor(page, code)
    await openRowMenu(page, code)
    await page.getByRole("menuitem", { name: "View" }).click()

    await expect(page).toHaveURL(new RegExp(`/products/${productUuid}$`))
    await expect(page.getByRole("heading", { name: "E2E View Product" })).toBeVisible()
  })

  test("row action Edit opens the edit form", async ({ page, request }) => {
    const code = uniqueCode("E2EEDIT")
    const { productUuid } = await seedProduct(request, {
      code,
      name: "E2E Edit Product",
    })

    await gotoApp(page, LIST)
    await searchFor(page, code)
    await openRowMenu(page, code)
    await page.getByRole("menuitem", { name: "Edit" }).click()

    await expect(page).toHaveURL(new RegExp(`/products/${productUuid}/edit$`))
    await expect(
      page.getByRole("heading", { name: "Edit Product", level: 1 })
    ).toBeVisible()
  })

  // ── Lifecycle ────────────────────────────────────────────────────────────
  test("walks the full lifecycle: publish, deactivate, reactivate", async ({
    page,
    request,
  }) => {
    const code = uniqueCode("E2ELIFE")
    const { productUuid } = await seedProduct(request, {
      code,
      name: "E2E Lifecycle Product",
    })
    await seedRequiredPrices(request, productUuid)
    await gotoApp(page, LIST)
    await searchFor(page, code)

    // Draft -> Active
    await openRowMenu(page, code)
    await page.getByRole("menuitem", { name: "Publish" }).click()
    await expect(page.getByText("Publish Product?")).toBeVisible()
    await page.getByRole("button", { name: "Confirm" }).click()
    await expect(page.getByText("Product published")).toBeVisible()

    // Active -> Inactive
    await openRowMenu(page, code)
    await page.getByRole("menuitem", { name: "Deactivate" }).click()
    await expect(page.getByText("Deactivate Product?")).toBeVisible()
    await page.getByRole("button", { name: "Confirm" }).click()
    await expect(page.getByText("Product deactivated")).toBeVisible()

    // Inactive -> Active
    await openRowMenu(page, code)
    await page.getByRole("menuitem", { name: "Reactivate" }).click()
    await expect(page.getByText("Reactivate Product?")).toBeVisible()
    await page.getByRole("button", { name: "Confirm" }).click()
    await expect(page.getByText("Product reactivated")).toBeVisible()
  })

  // ── Create wizard ────────────────────────────────────────────────────────
  test("create wizard blocks progress until required fields are filled", async ({
    page,
  }) => {
    await gotoApp(page, "/products/new")
    await expect(
      page.getByRole("heading", { name: "Basic Information" })
    ).toBeVisible()

    await expect(async () => {
      await page.getByRole("button", { name: "Next", exact: true }).click()
      await expect(page.getByText("Code is required")).toBeVisible({
        timeout: 1_500,
      })
    }).toPass({ timeout: 15_000 })

    await expect(page.getByText("Name is required")).toBeVisible()
  })

  test("creates a product and lands on its detail page", async ({ page }) => {
    const code = uniqueCode("E2EPRD")
    const name = `E2E Product ${code}`

    const uuid = await createProduct(page, { code, name })

    await expect(page).toHaveURL(new RegExp(`/products/${uuid}$`))
    await expect(page.getByRole("heading", { name })).toBeVisible()
    await expect(page.getByTestId("tab-prices")).toBeVisible()
  })

  // ── Import ───────────────────────────────────────────────────────────────
  test("import menu exposes every product import kind", async ({ page }) => {
    await gotoApp(page, LIST)
    await page.getByRole("button", { name: "Import" }).click()

    for (const item of [
      "Products",
      "Product prices",
      "Product batches",
      "Product fitments",
      "Product GST mappings",
      "Product relationships",
    ]) {
      await expect(
        page.getByRole("menuitem", { name: item, exact: true })
      ).toBeVisible()
    }

    // Opening a kind shows its bulk-upload dialog with template downloads.
    await page
      .getByRole("menuitem", { name: "Product prices", exact: true })
      .click()
    const dialog = page.getByRole("dialog")
    await expect(dialog.getByText("Bulk upload product prices")).toBeVisible()
    await expect(
      dialog.getByRole("button", { name: "Download CSV template" })
    ).toBeVisible()
    await expect(
      dialog.getByRole("button", { name: "Download Excel template" })
    ).toBeVisible()
  })

  // ── Export ───────────────────────────────────────────────────────────────
  test("exports the catalogue as CSV", async ({ page }) => {
    await gotoApp(page, LIST)

    await page.getByRole("button", { name: "Export" }).click()
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("menuitem", { name: "Export CSV" }).click(),
    ])

    expect(download.suggestedFilename()).toMatch(/\.csv$/i)
  })

  test("exports the catalogue as Excel", async ({ page }) => {
    await gotoApp(page, LIST)

    await page.getByRole("button", { name: "Export" }).click()
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("menuitem", { name: "Export Excel" }).click(),
    ])

    expect(download.suggestedFilename()).toMatch(/\.xlsx$/i)
  })
})
