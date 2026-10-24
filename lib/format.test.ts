import { describe, expect, it } from "vitest"

import {
  EMPTY_VALUE,
  formatDate,
  formatDateRange,
  formatDateTime,
  formatReference,
  formatReferenceOr,
  isUuid,
} from "./format"

const UUID = "8f14e45f-ceea-467a-9f0a-2f4c2e1a9b3d"

describe("formatDate", () => {
  it("renders date-only values as dd MMM yyyy", () => {
    expect(formatDate("2026-10-12")).toBe("12 Oct 2026")
  })

  it("renders timestamps without exposing the raw value", () => {
    expect(formatDate("2026-10-12T18:30:00Z")).toMatch(
      /^\d{2} [A-Z][a-z]{2} \d{4}$/
    )
  })

  it("falls back for empty or invalid values", () => {
    expect(formatDate()).toBe(EMPTY_VALUE)
    expect(formatDate("not-a-date")).toBe(EMPTY_VALUE)
  })
})

describe("formatDateTime", () => {
  it("renders timestamp values with time", () => {
    expect(formatDateTime("2026-10-12T18:30:00")).toMatch(
      /^\d{2} [A-Z][a-z]{2} \d{4}, \d{2}:\d{2} (AM|PM)$/
    )
  })
})

describe("formatDateRange", () => {
  it("formats both endpoints", () => {
    expect(formatDateRange("2026-10-12", "2026-11-01")).toBe(
      "12 Oct 2026 → 01 Nov 2026"
    )
  })

  it("keeps an open endpoint as a placeholder", () => {
    expect(formatDateRange("2026-10-12", null)).toBe("12 Oct 2026 → —")
  })
})

describe("UUID handling", () => {
  it("detects UUIDs", () => {
    expect(isUuid(UUID)).toBe(true)
    expect(isUuid("CUSTOMER-001")).toBe(false)
  })

  it("never returns a UUID as a display value", () => {
    expect(formatReference(UUID)).toBe(EMPTY_VALUE)
    expect(formatReference("Jane Doe")).toBe("Jane Doe")
    expect(formatReferenceOr(UUID, "CUSTOMER-001")).toBe("CUSTOMER-001")
    expect(formatReferenceOr(UUID, null)).toBe(EMPTY_VALUE)
  })
})
