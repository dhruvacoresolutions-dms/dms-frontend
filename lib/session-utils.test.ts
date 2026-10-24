import { describe, expect, it } from "vitest"

import { getJwtExpiryMs } from "./jwt"
import { resetServerClock, serverNow, syncServerClock } from "./server-clock"

function makeToken(payload: Record<string, unknown>): string {
  return [
    btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })),
    btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_"),
    "signature",
  ].join(".")
}

describe("getJwtExpiryMs", () => {
  it("reads the exp claim as epoch milliseconds", () => {
    const exp = 1_800_000_000
    const token = makeToken({ exp })

    expect(getJwtExpiryMs(token)).toBe(exp * 1000)
  })

  it("returns null for malformed tokens", () => {
    expect(getJwtExpiryMs("not-a-jwt")).toBeNull()
    expect(getJwtExpiryMs("a.%%%.c")).toBeNull()
    expect(getJwtExpiryMs(null)).toBeNull()
  })
})

describe("server clock", () => {
  it("tracks the offset between server and client time", () => {
    const offset = 90_000
    syncServerClock(new Date(Date.now() + offset).toISOString())

    expect(serverNow()).toBeGreaterThan(Date.now() + offset - 5_000)
    expect(serverNow()).toBeLessThan(Date.now() + offset + 5_000)

    resetServerClock()
    expect(Math.abs(serverNow() - Date.now())).toBeLessThan(1_000)
  })

  it("ignores invalid timestamps", () => {
    syncServerClock("not-a-date")
    expect(Math.abs(serverNow() - Date.now())).toBeLessThan(1_000)
  })
})
