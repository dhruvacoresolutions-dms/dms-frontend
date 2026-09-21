import type { PermissionResponse } from "../api/permission.types"

/** Generic display labels for known action codes. */
const ACTION_LABELS: Record<string, string> = {
  VIEW: "View",
  CREATE: "Create",
  UPDATE: "Update",
  DELETE: "Delete",
  ASSIGN: "Assign",
  ACCESS: "Access",
  LIST: "List",
  MANAGE: "Manage",
  APPROVE: "Approve",
  REJECT: "Reject",
  EXPORT: "Export",
  IMPORT: "Import",
}

/**
 * Normalized action key for a permission (e.g. `VIEW`). Prefers the
 * explicit `action` / `actionCode` fields and falls back to the last
 * segment of the permission `code` (e.g. `SFA_MOBILE_ACCESS` → `ACCESS`)
 * since some catalog entries arrive without it.
 */
export function getPermissionActionKey(perm: PermissionResponse): string {
  const fromCode = perm.code.split(/[._]/).pop()?.trim() ?? ""
  return (
    perm.actionCode?.trim() || perm.action?.trim() || fromCode
  ).toUpperCase()
}

/**
 * Generic action name for a permission (e.g. `VIEW` → `View`).
 * Falls back to the last segment of the permission `code`
 * (e.g. `SFA_MOBILE_ACCESS` → `Access`) when `action`/`actionCode` is
 * missing, since some catalog entries arrive without it. The full
 * permission `name` is intentionally not shown next to the resource/module
 * name.
 */
export function getPermissionActionLabel(
  actionCode: string | undefined | null,
  code?: string,
  action?: string | undefined | null
): string {
  const fromCode = code?.split(/[._]/).pop()?.trim()
  const normalized = (
    actionCode?.trim() ||
    action?.trim() ||
    fromCode ||
    ""
  ).toUpperCase()
  if (!normalized) return "Other"
  if (ACTION_LABELS[normalized]) return ACTION_LABELS[normalized]
  return normalized
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

/** Group catalog permissions by resource, preserving first-seen order. */
export function groupPermissionsByResource(
  permissions: PermissionResponse[]
): [string, PermissionResponse[]][] {
  const grouped = new Map<string, PermissionResponse[]>()
  for (const perm of permissions) {
    const list = grouped.get(perm.resourceCode) ?? []
    list.push(perm)
    grouped.set(perm.resourceCode, list)
  }
  return Array.from(grouped.entries())
}

/**
 * Group catalog permissions by module (`moduleCode`), preserving
 * first-seen order. Falls back to `resourceCode` for entries without a
 * module. Used by the Manage Permissions pickers so each module renders
 * as a single row.
 */
export function groupPermissionsByModule(
  permissions: PermissionResponse[]
): [string, PermissionResponse[]][] {
  const grouped = new Map<string, PermissionResponse[]>()
  for (const perm of permissions) {
    const key = perm.moduleCode?.trim() || perm.resourceCode
    const list = grouped.get(key) ?? []
    list.push(perm)
    grouped.set(key, list)
  }
  return Array.from(grouped.entries())
}

/**
 * Human-readable module/resource label for a code
 * (e.g. `ROLE_PERMISSION` → `Role Permission`).
 */
export function formatModuleLabel(code: string | undefined | null): string {
  if (!code) return "Other"
  return code
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
