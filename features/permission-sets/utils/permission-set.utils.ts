import { getApiError } from "@/lib/api/api-error"
import { PERMISSION_SET_ERROR_MESSAGES } from "../configs/permission-set.constants"
import type {
  PermissionSetDetail,
  PermissionSetListItem,
} from "../api/permission-set.types"

/** Canonical id — BE uses `permissionSetUuid`. Falls back to legacy `publicId`. */
export function getPermissionSetId(
  set: Pick<PermissionSetListItem, "permissionSetUuid"> & {
    publicId?: string
  }
): string {
  return set.permissionSetUuid ?? set.publicId ?? ""
}

/**
 * Canonical permission list — BE detail uses `permissionCodes`, with a
 * fallback to a legacy `permissions` key since real responses vary.
 */
export function getPermissionSetPermissions(
  set: PermissionSetDetail
): string[] {
  return set.permissionCodes ?? set.permissions ?? []
}

/** Group `SCOPE.RESOURCE.ACTION`-style codes by their first segment for display. */
export function groupPermissionsByPrefix(
  permissionCodes: string[]
): Record<string, string[]> {
  const grouped: Record<string, string[]> = {}
  for (const code of permissionCodes) {
    const prefix = code.split(/[._]/)[0] ?? "other"
    if (!grouped[prefix]) grouped[prefix] = []
    grouped[prefix].push(code)
  }
  return grouped
}

/** Map backend `code` (e.g. PERMISSION_SET_ALREADY_EXISTS) to a friendly message. */
export function getPermissionSetErrorMessage(
  error: unknown,
  fallback: string
): string {
  const apiError = getApiError(error)
  if (!apiError) return fallback
  if (apiError.code && PERMISSION_SET_ERROR_MESSAGES[apiError.code]) {
    return PERMISSION_SET_ERROR_MESSAGES[apiError.code]
  }
  if (apiError.message) return apiError.message
  const fieldError = apiError.errors?.[0]
  if (fieldError) return `${fieldError.field}: ${fieldError.message}`
  return fallback
}

/** Route helpers so `/permission-sets` and `/companies/[companyUuid]/permission-sets` share components. */
export function getPermissionSetsBasePath(companyUuid: string | null): string {
  if (!companyUuid || companyUuid === "current") return "/permission-sets"
  return `/companies/${companyUuid}/permission-sets`
}

export function getPermissionSetDetailPath(
  companyUuid: string | null,
  setUuid: string
): string {
  return `${getPermissionSetsBasePath(companyUuid)}/${setUuid}`
}
