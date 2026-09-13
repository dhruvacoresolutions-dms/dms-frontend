import type { RoleStatus } from "../api/role.types"

/** BE constraint: `code` must match `[A-Z0-9_]{2,80}`. */
export const ROLE_CODE_PATTERN = /^[A-Z0-9_]+$/
export const ROLE_CODE_MIN_LENGTH = 2
export const ROLE_CODE_MAX_LENGTH = 80
export const ROLE_CODE_HINT = "Uppercase letters, numbers, or underscores (2–80 chars)"

export const ROLE_STATUS_OPTIONS: { value: RoleStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
]

/** Backend error codes surfaced by the Roles APIs. */
export const ROLE_ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  ROLE_ALREADY_EXISTS: "ROLE_ALREADY_EXISTS",
  ROLE_NOT_FOUND: "ROLE_NOT_FOUND",
  SYSTEM_ROLE_IMMUTABLE: "SYSTEM_ROLE_IMMUTABLE",
  PERMISSION_NOT_FOUND: "PERMISSION_NOT_FOUND",
} as const

export const ROLE_ERROR_MESSAGES: Record<string, string> = {
  [ROLE_ERROR_CODES.ROLE_ALREADY_EXISTS]:
    "A role with this code already exists.",
  [ROLE_ERROR_CODES.ROLE_NOT_FOUND]: "Role not found.",
  [ROLE_ERROR_CODES.SYSTEM_ROLE_IMMUTABLE]:
    "System-defined roles cannot be modified.",
  [ROLE_ERROR_CODES.PERMISSION_NOT_FOUND]:
    "One or more permission codes were not found.",
}
