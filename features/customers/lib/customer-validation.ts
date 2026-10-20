import { z } from "zod"

/**
 * Frontend mirror of `CustomerModels.Request` validation plus the pincode
 * mapping / bank / credit / KYC contracts from `CustomerLifecycleModels`.
 */

/** `CustomerModels.Request.mobile` → `[6-9][0-9]{9}` (10-digit Indian mobile). */
export const CUSTOMER_MOBILE_PATTERN = /^[6-9][0-9]{9}$/
/** `CustomerModels.Request.pincode` → `[1-9][0-9]{5}`. */
export const CUSTOMER_PINCODE_PATTERN = /^[1-9][0-9]{5}$/
/** `CustomerLifecycleModels.Bank.ifsc` → `[A-Z]{4}0[A-Z0-9]{6}`. */
export const CUSTOMER_IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/i
/** `CustomerLifecycleModels.Bank.accountNumber` → `[0-9]{6,20}`. */
export const CUSTOMER_BANK_ACCOUNT_PATTERN = /^[0-9]{6,20}$/

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
    .regex(CUSTOMER_BANK_ACCOUNT_PATTERN, "Account number must be 6-20 digits")
}
