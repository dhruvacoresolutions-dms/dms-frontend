import { describe, expect, it } from "vitest"
import {
  CUSTOMER_CONTACT_PERSON_PATTERN,
  CUSTOMER_VERIFICATION_REF_PATTERN,
  aadhaarDigits,
  customerKycNumberPattern,
  formatAadhaar,
  optionalVerificationRef,
  sanitizeContactPerson,
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

describe("customer Aadhaar input formatting", () => {
  it("keeps only the first 12 digits in the stored value", () => {
    expect(aadhaarDigits("1234 5678 9012")).toBe("123456789012")
    expect(aadhaarDigits("1234-5678-9012-3456")).toBe("123456789012")
    expect(aadhaarDigits("abc1234def5678ghi9012")).toBe("123456789012")
  })

  it("groups the display value as XXXX-XXXX-XXXX", () => {
    expect(formatAadhaar("123456789012")).toBe("1234-5678-9012")
    expect(formatAadhaar("1234")).toBe("1234")
    expect(formatAadhaar("12345")).toBe("1234-5")
    expect(aadhaarDigits(formatAadhaar("234567890123"))).toBe("234567890123")
  })
})

describe("contact person rule", () => {
  it("accepts letters and single spaces only", () => {
    expect(CUSTOMER_CONTACT_PERSON_PATTERN.test("Aman Dhariwal")).toBe(true)
    expect(CUSTOMER_CONTACT_PERSON_PATTERN.test("Rahul")).toBe(true)
    expect(CUSTOMER_CONTACT_PERSON_PATTERN.test("Rahul  Patel")).toBe(false)
    expect(CUSTOMER_CONTACT_PERSON_PATTERN.test("Rahul2")).toBe(false)
    expect(CUSTOMER_CONTACT_PERSON_PATTERN.test("Rahul-Patel")).toBe(false)
  })

  it("strips digits, punctuation and extra spaces from typed input", () => {
    expect(sanitizeContactPerson("Rahul 123 Patel!")).toBe("Rahul Patel")
    expect(sanitizeContactPerson("Rahul  Patel")).toBe("Rahul Patel")
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
