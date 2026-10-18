# Playwright E2E tests

End-to-end tests for the **Products** page (list, filters, lifecycle, import,
export, create wizard) and the **Pricing** sub-module, driven against a running
frontend (`http://localhost:3000` by default).

## How to run

```bash
npm run test:e2e          # runs the whole suite (headless)
npm run test:e2e -- --ui  # interactive UI mode

# Just the Products page
npx playwright test tests/e2e/products.spec.ts --project=chromium
```

The config reuses an already-running dev server when one is present, otherwise
it starts `npm run dev` automatically.

## Authentication

`playwright.config.ts` loads `.env` (including `.env.local`) via `@next/env`, so
`E2E_USERNAME` / `E2E_PASSWORD` / `NEXT_PUBLIC_API_URL` are picked up without
exporting anything.

The `setup` project logs in through the UI on every run and refreshes
`tests/e2e/.auth/user.json` (access tokens expire after ~30 minutes). Without
credentials, the suite falls back to whatever storage state is already on disk.

> The login form is filled by placeholder (`Enter your username` /
> `Enter your password`) because the password field's "Show password" button
> makes `getByLabel("Password")` ambiguous.

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `E2E_BASE_URL` | `http://localhost:3000` | Frontend URL under test |
| `E2E_USERNAME` / `E2E_PASSWORD` | from `.env` | Login credentials for the setup project |
| `NEXT_PUBLIC_API_URL` | from `.env` | Backend base URL used by the API seeding helper |
| `E2E_NO_WEBSERVER` | – | Skip Playwright's dev-server management |

## Test data

Tests seed data through the backend API (`tests/e2e/utils/api.ts`) instead of
driving the wizard, which keeps runs fast and deterministic. Codes use an `E2E…`
prefix and are left behind so runs stay traceable — clean them up from the UI if
needed.

Notes learned the hard way:

- `code` must be letters + numbers only (any other character → `400 Malformed request`).
- `batchTrackingEnabled` must always be sent as a boolean; omitting it (or sending
  `null`) also yields a bare `400 Malformed request`.
- A product cannot be **published** until it has a current price for every price
  type flagged `requiredForPublish` (MRP, Distributor Purchase Rate). The helper
  `seedRequiredPrices()` creates those before lifecycle tests.

## Layout

```
tests/e2e/
├── auth.setup.ts        # logs in and writes .auth/user.json
├── products.spec.ts     # Products page suite (full coverage)
├── pricing.spec.ts      # product detail → Prices tab
├── utils/api.ts         # API seeding helpers (product + required prices)
└── utils/helpers.ts     # gotoApp, uniqueCode, createProduct, field selectors
```
