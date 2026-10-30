import { z } from "zod"
import type { CustomerKycDocType } from "../api/customer.types"

/**
 * Frontend mirror of `CustomerModels.Request` validation plus the pincode
 * mapping / bank / credit / KYC contracts from `CustomerModels`,
 * `CustomerLifecycleModels` and `CustomerEntryModels`.
 */

/** `CustomerModels.Request.mobile` → `[6-9][0-9]{9}` (10-digit Indian mobile). */
export const CUSTOMER_MOBILE_PATTERN = /^[6-9][0-9]{9}$/
/** `CustomerModels.Request.pincode` → `[1-9][0-9]{5}`. */
export const CUSTOMER_PINCODE_PATTERN = /^[1-9][0-9]{5}$/
/** `CustomerLifecycleModels.Bank.ifsc` → `[A-Z]{4}0[A-Z0-9]{6}`. */
export const CUSTOMER_IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/i
/** `CustomerLifecycleModels.Bank.accountNumber` → `[0-9]{9,18}`. */
export const CUSTOMER_BANK_ACCOUNT_PATTERN = /^[0-9]{9,18}$/
/** `CustomerLifecycleModels.Bank.accountType` → `[A-Za-z _]*`, max 30. */
export const CUSTOMER_ACCOUNT_TYPE_PATTERN = /^[A-Za-z _]*$/
/** `CustomerModels.Request` GSTIN → 15-char Indian GSTIN. */
export const CUSTOMER_GSTIN_PATTERN =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
/** `CustomerModels.Request.pan` → 10-char PAN. */
export const CUSTOMER_PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/
/** `CustomerEntries.validateHolderName` → letters, spaces, dots, apostrophes, hyphens. */
export const CUSTOMER_HOLDER_NAME_PATTERN = /^[\p{L} .'-]+$/u

/** `CustomerModels.Request.shopSizeSqFt` → integer 0…10,000,000. */
export const CUSTOMER_SHOP_SIZE_MAX = 10_000_000
/** `CustomerModels.Request.monthlyPotential` → integer 0…9,999,999,999. */
export const CUSTOMER_MONTHLY_POTENTIAL_MAX = 9_999_999_999

/** Accepted KYC document types (create `kyc[]` and `/kyc-entries`). */
export const CUSTOMER_KYC_DOC_TYPES: {
  value: CustomerKycDocType
  label: string
  placeholder: string
}[] = [
  { value: "AADHAAR", label: "Aadhaar", placeholder: "12-digit Aadhaar number" },
  { value: "PAN", label: "PAN", placeholder: "ABCDE1234F" },
  {
    value: "DRIVING_LICENCE",
    label: "Driving licence",
    placeholder: "5–20 letters or digits",
  },
  { value: "VOTER_ID", label: "Voter ID", placeholder: "5–20 letters or digits" },
  { value: "PASSPORT", label: "Passport", placeholder: "5–20 letters or digits" },
]

/** `CustomerEntries.validateNumber` regexes, keyed by `docType`. */
export function customerKycNumberPattern(docType: CustomerKycDocType): RegExp {
  switch (docType) {
    case "AADHAAR":
      return /^\d{12}$/
    case "PAN":
      return /^[A-Z]{5}[0-9]{4}[A-Z]$/
    default:
      return /^[A-Za-z0-9]{5,20}$/
  }
}

export function customerKycNumberMessage(docType: CustomerKycDocType) {
  switch (docType) {
    case "AADHAAR":
      return "Enter a 12-digit Aadhaar number"
    case "PAN":
      return "Enter a valid PAN (e.g. ABCDE1234F)"
    default:
      return "Enter 5–20 letters or digits"
  }
}

export function customerMobile(label = "Mobile number") {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .regex(CUSTOMER_MOBILE_PATTERN, "Enter a 10-digit mobile starting with 6-9")
}

export function optionalCustomerMobile(label = "Alternate mobile") {
  return z
    .string()
    .trim()
    .refine(
      (v) => v === "" || CUSTOMER_MOBILE_PATTERN.test(v),
      `${label} must be a 10-digit number starting with 6-9`
    )
}

export function customerPincode() {
  return z
    .string()
    .trim()
    .min(1, "Pincode is required")
    .regex(CUSTOMER_PINCODE_PATTERN, "Pincode must be 6 digits and start with 1-9")
}

export function customerIfsc() {
  return z
    .string()
    .trim()
    .min(1, "IFSC is required")
    .regex(CUSTOMER_IFSC_PATTERN, "Enter a valid IFSC (e.g. HDFC0001234)")
}

export function customerBankAccount() {
  return z
    .string()
    .trim()
    .min(1, "Account number is required")
    .regex(CUSTOMER_BANK_ACCOUNT_PATTERN, "Account number must be 9-18 digits")
}

/** Optional `accountType` (≤30 chars, letters, spaces and underscores). */
export function optionalAccountType() {
  return z
    .string()
    .trim()
    .max(30, "Account type must not exceed 30 characters")
    .refine(
      (v) => v === "" || CUSTOMER_ACCOUNT_TYPE_PATTERN.test(v),
      "Use letters, spaces and underscores only"
    )
}

/** Optional PAN; the API only pattern-checks it (no PAN/GSTIN cross-check). */
export function customerPan() {
  return z
    .string()
    .trim()
    .max(10, "PAN must not exceed 10 characters")
    .refine(
      (v) =>
        v === "" || CUSTOMER_PAN_PATTERN.test(v.trim().toUpperCase()),
      "Enter a valid PAN (e.g. ABCDE1234F)"
    )
}

export function customerGstin() {
  return z
    .string()
    .trim()
    .min(1, "GSTIN is required for registered customers")
    .regex(
      CUSTOMER_GSTIN_PATTERN,
      "Enter a valid 15-character GSTIN (e.g. 29ABCDE1234F1Z5)"
    )
}

/**
 * Required whole-number field mirroring the backend's
 * `CustomerIntegerDeserializer` (strings and decimals are rejected).
 * Returns a string because `FormNumberField` emits strings.
 */
export function customerInteger(
  label: string,
  { min = 0, max }: { min?: number; max: number }
) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .regex(/^\d+$/, `${label} must be a whole number`)
    .refine((v) => Number(v) >= min, `${label} must be at least ${min}`)
    .refine(
      (v) => Number(v) <= max,
      `${label} must not exceed ${max.toLocaleString("en-IN")}`
    )
}

/** Optional money amount (2 decimals, negative allowed for advances). */
export function optionalMoney(label: string) {
  return z
    .string()
    .trim()
    .refine(
      (v) => v === "" || /^-?\d+(\.\d{1,2})?$/.test(v),
      `${label} must be a number with up to 2 decimals`
    )
}

/** Required money amount (max 2 decimals). */
export function requiredMoney(label: string) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine(
      (v) => /^\d+(\.\d{1,2})?$/.test(v),
      `${label} must be a number with up to 2 decimals`
    )
}

/** `CustomerEntries.validateHolderName` — 1–100 letters, spaces, dots, apostrophes, hyphens. */
export function customerHolderName(label: string) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(100, `${label} must not exceed 100 characters`)
    .regex(
      CUSTOMER_HOLDER_NAME_PATTERN,
      "Use letters, spaces, dots, apostrophes or hyphens only"
    )
}
