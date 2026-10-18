import fs from "node:fs"
import path from "node:path"
import type { APIRequestContext } from "@playwright/test"

const AUTH_FILE = path.resolve(process.cwd(), "tests/e2e/.auth/user.json")

type Session = {
  accessToken: string
  user: { companyUuid: string }
}

/** Reads the access token + company from the saved storage state. */
export function readSession(): Session {
  const state = JSON.parse(fs.readFileSync(AUTH_FILE, "utf8"))
  const entry = state.origins[0].localStorage.find(
    (e: { name: string }) => e.name === "dms-auth"
  )
  return JSON.parse(entry.value).state.session
}

function apiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL
  const env = fs.readFileSync(path.resolve(process.cwd(), ".env"), "utf8")
  const match = env.match(/^NEXT_PUBLIC_API_URL=(.+)$/m)
  return match ? match[1].trim() : "http://localhost:8000"
}

function authHeaders(): Record<string, string> {
  const session = readSession()
  return {
    Authorization: `Bearer ${session.accessToken}`,
    "X-Company-Context": session.user.companyUuid,
  }
}

/**
 * Creates a product directly through the API so tests can seed data quickly
 * instead of driving the 3-step wizard every time.
 *
 * `batchTrackingEnabled` is sent explicitly: the backend binds the body to a
 * record whose primitive `boolean` field rejects a missing/null value with a
 * bare 400 "Malformed request".
 */
export async function seedProduct(
  request: APIRequestContext,
  input: { code: string; name: string } & Record<string, unknown>
): Promise<{ productUuid: string }> {
  const session = readSession()
  const url = `${apiBaseUrl()}/api/v1/companies/${session.user.companyUuid}/products`
  const res = await request.post(url, {
    headers: authHeaders(),
    data: { batchTrackingEnabled: false, ...input },
  })
  if (!res.ok()) {
    throw new Error(`seedProduct failed (${res.status()}): ${await res.text()}`)
  }
  return (await res.json()).data
}

type PriceType = {
  code: string
  name: string
  requiredForPublish?: boolean
}

/**
 * A bare product cannot be published: the backend requires a current price for
 * every price type flagged `requiredForPublish` (e.g. MRP, Distributor Purchase
 * Rate). This seeds those prices so lifecycle tests can publish a product.
 */
export async function seedRequiredPrices(
  request: APIRequestContext,
  productUuid: string
): Promise<string[]> {
  const session = readSession()
  const base = `${apiBaseUrl()}/api/v1/companies/${session.user.companyUuid}`

  const typesRes = await request.get(`${base}/price-types`, {
    headers: authHeaders(),
  })
  if (!typesRes.ok()) {
    throw new Error(`price-types failed (${typesRes.status()})`)
  }
  const types: PriceType[] = (await typesRes.json()).data.content
  const required = types.filter((t) => t.requiredForPublish)

  // UTC date so the price is already effective regardless of server timezone.
  const effectiveFrom = new Date().toISOString().slice(0, 10)

  for (const type of required) {
    const res = await request.post(`${base}/products/${productUuid}/prices`, {
      headers: authHeaders(),
      data: { priceTypeCode: type.code, amount: "199.50", effectiveFrom },
    })
    if (!res.ok()) {
      throw new Error(
        `seed price ${type.code} failed (${res.status()}): ${await res.text()}`
      )
    }
  }

  return required.map((t) => t.code)
}
