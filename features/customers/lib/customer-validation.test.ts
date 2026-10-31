import { describe, expect, it } from "vitest"
import {
  CUSTOMER_VERIFICATION_REF_PATTERN,
  customerKycNumberPattern,
  optionalVerificationRef,
} from "./customer-validation"

describe("customer KYC number rules", () => {
  it("requires an Aadhaar number that starts with 2-9", () => {
    const aadhaar = customerKycNumberPattern("AADHAAR")
    expect(aadhaar.test("234567890123")).toBe(true)
    expect(aadhaar.test("034567890123")).toBe(false)
    expect(aadhaar.test("134567890123")).toBe(false)
    expect(aadhaar.test("23456789012")).toBe(false)
  })

  it("keeps the PAN and alphanumeric document rules", () => {
    expect(customerKycNumberPattern("PAN").test("ABCDE1234F")).toBe(true)
    expect(customerKycNumberPattern("PAN").test("abcde1234f")).toBe(false)
    expect(customerKycNumberPattern("PASSPORT").test("A1234567")).toBe(true)
    expect(customerKycNumberPattern("VOTER_ID").test("ABC")).toBe(false)
  })
})

describe("customer KYC verificationRef", () => {
  it("accepts the vendor id charset", () => {
    expect(CUSTOMER_VERIFICATION_REF_PATTERN.test("ver_91c2")).toBe(true)
    expect(CUSTOMER_VERIFICATION_REF_PATTERN.test("aadhaar-2026:01.12")).toBe(
      true
    )
    expect(CUSTOMER_VERIFICATION_REF_PATTERN.test("ver 91c2")).toBe(false)
    expect(CUSTOMER_VERIFICATION_REF_PATTERN.test("ver/91c2")).toBe(false)
  })

  it("treats an empty or blank value as optional", () => {
    expect(optionalVerificationRef().safeParse("").success).toBe(true)
    expect(optionalVerificationRef().safeParse("   ").success).toBe(true)
    expect(optionalVerificationRef().safeParse("ver_91c2").success).toBe(true)
  })

  it("rejects values over 100 characters", () => {
    expect(optionalVerificationRef().safeParse("a".repeat(100)).success).toBe(
      true
    )
    expect(optionalVerificationRef().safeParse("a".repeat(101)).success).toBe(
      false
    )
  })
})
