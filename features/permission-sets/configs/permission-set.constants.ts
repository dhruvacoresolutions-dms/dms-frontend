/** BE constraint: `code` must match `[A-Z0-9_]{2,80}`. */
export const PERMISSION_SET_CODE_PATTERN = /^[A-Z0-9_]+$/
export const PERMISSION_SET_CODE_MIN_LENGTH = 2
export const PERMISSION_SET_CODE_MAX_LENGTH = 80
export const PERMISSION_SET_CODE_HINT =
  "Uppercase letters, numbers, or underscores (2–80 chars)"

/** Backend error codes surfaced by the Permission Set APIs. */
export const PERMISSION_SET_ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  PERMISSION_SET_ALREADY_EXISTS: "PERMISSION_SET_ALREADY_EXISTS",
  PERMISSION_SET_NOT_FOUND: "PERMISSION_SET_NOT_FOUND",
  PERMISSION_NOT_FOUND: "PERMISSION_NOT_FOUND",
} as const

export const PERMISSION_SET_ERROR_MESSAGES: Record<string, string> = {
  [PERMISSION_SET_ERROR_CODES.PERMISSION_SET_ALREADY_EXISTS]:
    "A permission set with this code already exists.",
  [PERMISSION_SET_ERROR_CODES.PERMISSION_SET_NOT_FOUND]:
    "Permission set not found.",
  [PERMISSION_SET_ERROR_CODES.PERMISSION_NOT_FOUND]:
    "One or more permission codes were not found.",
}
