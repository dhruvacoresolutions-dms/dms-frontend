import { getApiError } from "@/lib/api/api-error"
import { ROLE_ERROR_MESSAGES } from "../configs/role.constants"
import type { RoleDetail, RoleListItem } from "../api/role.types"

/** Canonical id — BE uses `roleUuid`. Falls back to legacy `publicId`. */
export function getRoleId(
  role: Pick<RoleListItem, "roleUuid"> & { publicId?: string }
): string {
  return role.roleUuid ?? role.publicId ?? ""
}

/** Canonical permission list — BE detail uses `permissionCodes`. */
export function getRolePermissions(role: RoleDetail): string[] {
  return role.permissionCodes ?? []
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

/** Map backend `code` (e.g. ROLE_ALREADY_EXISTS) to a friendly message. */
export function getRoleErrorMessage(
  error: unknown,
  fallback: string
): string {
  const apiError = getApiError(error)
  if (!apiError) return fallback
  if (apiError.code && ROLE_ERROR_MESSAGES[apiError.code]) {
    return ROLE_ERROR_MESSAGES[apiError.code]
  }
  if (apiError.message) return apiError.message
  const fieldError = apiError.errors?.[0]
  if (fieldError) return `${fieldError.field}: ${fieldError.message}`
  return fallback
}

/** Route helpers so `/roles` and `/companies/[companyUuid]/roles` share components. */
export function getRolesBasePath(companyUuid: string | null): string {
  if (!companyUuid || companyUuid === "current") return "/roles"
  return `/companies/${companyUuid}/roles`
}

export function getRoleDetailPath(
  companyUuid: string | null,
  roleUuid: string
): string {
  return `${getRolesBasePath(companyUuid)}/${roleUuid}`
}
