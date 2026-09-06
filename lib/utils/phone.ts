/**
 * Indian phone utilities — fixed +91 prefix, 10-digit mobile validation
 * Valid Indian mobile: 10 digits, starts with 6-9
 */

export const INDIAN_MOBILE_10_REGEX = /^[6-9]\d{9}$/
export const INDIAN_MOBILE_E164_REGEX = /^\+91[6-9]\d{9}$/

/** Strip all non-digits and remove leading 91/+91 if present, return 10-digit core */
export function normalizeIndianMobile(input: string): string {
  if (!input) return ""
  let digits = input.replace(/\D/g, "")
  // Remove leading 91 if total is 12 and starts with 91 (e.g., 919876543210 or +919876543210 -> 919...)
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2)
  } else if (digits.length === 11 && digits.startsWith("91")) {
    // handle 91 + 10 without + (unlikely) or leading 0
    digits = digits.slice(-10)
  } else if (digits.length > 10) {
    digits = digits.slice(-10)
  }
  return digits.slice(0, 10)
}

/** Check if a 10-digit or +91 number is valid Indian mobile */
export function isValidIndianMobile(input: string): boolean {
  const core = normalizeIndianMobile(input)
  return INDIAN_MOBILE_10_REGEX.test(core)
}

/** Convert any input to E.164 +91 format, or null if invalid */
export function toE164IndianMobile(input: string): string | null {
  const core = normalizeIndianMobile(input)
  if (!INDIAN_MOBILE_10_REGEX.test(core)) return null
  return `+91${core}`
}

/** Ensure value sent to BE always has +91 prefix */
export function ensurePlus91(input: string): string {
  const core = normalizeIndianMobile(input)
  if (!core) return input
  return `+91${core}`
}

/** Mask helper for display: 98765 43210 or +91 98765 43210 */
export function formatIndianMobileForDisplay(input: string, withCountry = false): string {
  const core = normalizeIndianMobile(input)
  if (core.length !== 10) return input
  const formatted = `${core.slice(0, 5)} ${core.slice(5)}`
  return withCountry ? `+91 ${formatted}` : formatted
}
