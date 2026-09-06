/**
 * GSTIN utilities — common helpers for Indian GSTIN ↔ PAN extraction
 * GSTIN format: 15 chars -> [0-1] state code (2 digits) + [2-11] PAN (10 chars) + [12] entity + [13] Z + [14] checksum
 * Example: 23ABCDE1234F1Z5 -> PAN = ABCDE1234F
 */

export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/

export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/

export function isValidGstin(gstin: string): boolean {
  if (!gstin) return false
  return GSTIN_REGEX.test(gstin.toUpperCase().trim())
}

export function isValidPan(pan: string): boolean {
  if (!pan) return false
  return PAN_REGEX.test(pan.toUpperCase().trim())
}

/**
 * Extract PAN (10 chars) from a valid GSTIN.
 * Returns null if GSTIN is not valid.
 */
export function extractPanFromGstin(gstin: string): string | null {
  if (!gstin) return null
  const normalized = gstin.toUpperCase().trim()
  if (!isValidGstin(normalized)) return null
  // characters 2..12 (0-indexed) => substring(2, 12)
  const pan = normalized.substring(2, 12)
  return PAN_REGEX.test(pan) ? pan : null
}

/**
 * Get PAN from GSTIN without strict GSTIN validation (lenient).
 * Useful if you only need the 10-char slice and will validate PAN separately.
 */
export function getPanFromGstinLenient(gstin: string): string | null {
  if (!gstin) return null
  const normalized = gstin.toUpperCase().trim()
  if (normalized.length < 12) return null
  const pan = normalized.substring(2, 12)
  return PAN_REGEX.test(pan) ? pan : null
}
