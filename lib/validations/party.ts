import { z } from "zod"

/**
 * Frontend mirror of the backend Distributor / Supplier validation contract.
 *
 * These helpers are shared by the two party modules (distributors, suppliers)
 * and by both bank-account validators (`DistributorBankAccountValidator` /
 * `SupplierBankAccountValidator`), which use the exact same rules.
 *
 * Note: the backend trims and upper-cases codes, PAN, GSTIN and IFSC before
 * validating, so the patterns below are applied case-insensitively and the
 * payload builders upper-case the values on submit.
 */

/** `GstinValidator.FORMAT` (applied to the upper-cased value). */
export const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i
/** `PanValidator.FORMAT` (applied to the upper-cased value). */
export const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/i
/** `CreateSupplierRequest.phone` and the distributor branch mobile pattern. */
export const PHONE_PATTERN = /^\+?[0-9]{7,15}$/
/** Bank `ifscCode` (validated after upper-casing). */
export const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/i
/** Bank `accountNumber`. */
export const BANK_ACCOUNT_PATTERN = /^[0-9]{9,18}$/
/** Frontend email shape check (backend uses jakarta `@Email`). */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Optional phone. Jakarta `@Pattern` allows an empty string, so an empty value
 * passes and any other value must match `PHONE_PATTERN`.
 */
export function optionalPhone(label = "phone") {
  return z
    .string()
    .trim()
    .refine(
      (v) => v === "" || PHONE_PATTERN.test(v),
      `Enter a valid ${label.toLowerCase()}`
    )
}

/** Optional email (`@Email @Size(max=254)`). */
export function optionalEmail(max = 254) {
  return z
    .string()
    .trim()
    .max(max, `Email must not exceed ${max} characters`)
    .refine((v) => v === "" || EMAIL_PATTERN.test(v), "Enter a valid email")
}

/** Required PAN, validated case-insensitively. */
export function requiredPan(label = "PAN") {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine((v) => PAN_PATTERN.test(v), `Enter a valid ${label}`)
}

/** Optional PAN — validated only when supplied. */
export function optionalPan(label = "PAN") {
  return z
    .string()
    .trim()
    .refine((v) => v === "" || PAN_PATTERN.test(v), `Enter a valid ${label}`)
}

/** Optional GSTIN — validated only when supplied. */
export function optionalGstin(label = "GSTIN") {
  return z
    .string()
    .trim()
    .refine((v) => v === "" || GSTIN_PATTERN.test(v), `Enter a valid ${label}`)
}

/** Required IFSC, validated after upper-casing. */
export function requiredIfsc(label = "IFSC code") {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine((v) => IFSC_PATTERN.test(v), `Enter a valid ${label}`)
}

/** Required bank account number (9–18 digits). */
export function requiredBankAccount(label = "Account number") {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine((v) => BANK_ACCOUNT_PATTERN.test(v), `${label} must be 9–18 digits`)
}
