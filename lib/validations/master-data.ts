import { z } from "zod"

/**
 * Frontend mirror of the backend master-data validation contract.
 *
 * The backend validates codes with `@SafeCode` (SafeText.CODE) and human names
 * with `@SafeName` (SafeText.NAME). Keeping the same patterns here means users
 * get inline feedback instead of a 400 from the API.
 *
 * NOTE: literal text in existing forms already used wider patterns
 * (e.g. `._-`); those values are rejected by the backend, so they are
 * intentionally tightened here.
 */

/** `@SafeCode`: letters and digits only. */
export const BACKEND_CODE_PATTERN = /^[A-Za-z0-9]+$/
/** `@SafeName`: letters/digits with single spaces between words. */
export const BACKEND_NAME_PATTERN = /^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$/

export const BACKEND_CODE_MESSAGE = "Only letters and numbers are allowed"
export const BACKEND_NAME_MESSAGE =
  "Only letters, numbers and single spaces are allowed"

/** Required backend code field (`@NotBlank @Size(max) @SafeCode`). */
export function requiredCode(label = "Code", max = 50) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must not exceed ${max} characters`)
    .regex(BACKEND_CODE_PATTERN, BACKEND_CODE_MESSAGE)
}

/** Required backend name field (`@NotBlank @Size(max) @SafeName`). */
export function requiredName(label = "Name", max = 160) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must not exceed ${max} characters`)
    .regex(BACKEND_NAME_PATTERN, BACKEND_NAME_MESSAGE)
}

/** Optional `@SafeName` field that treats an empty string as "not supplied". */
export function optionalName(label = "Name", max = 160) {
  return z
    .string()
    .trim()
    .max(max, `${label} must not exceed ${max} characters`)
    .refine(
      (v) => v === "" || BACKEND_NAME_PATTERN.test(v),
      BACKEND_NAME_MESSAGE
    )
}

/** Optional `@SafeCode` field that treats an empty string as "not supplied". */
export function optionalCode(label = "Code", max = 50) {
  return z
    .string()
    .trim()
    .max(max, `${label} must not exceed ${max} characters`)
    .refine(
      (v) => v === "" || BACKEND_CODE_PATTERN.test(v),
      BACKEND_CODE_MESSAGE
    )
}

/** Optional free-text field (`@Size(max)` only, no character restriction). */
export function optionalText(label = "Description", max = 500) {
  return z
    .string()
    .trim()
    .max(max, `${label} must not exceed ${max} characters`)
    .optional()
}

/** Required free-text field (`@NotBlank @Size(max)`). */
export function requiredText(label: string, max: number) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must not exceed ${max} characters`)
}

/** Optional ISO-8601 date string that treats an empty string as "not supplied". */
export function optionalDate() {
  return z.string().optional()
}
