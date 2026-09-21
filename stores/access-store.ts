"use client"

import { create } from "zustand"
import { normalizePermissionCode } from "@/lib/permissions/permissions"
import type {
  EmployeeAccessResponse,
  MyAccessResponse,
} from "@/features/auth/api/auth.types"

export type EffectiveAccess = {
  userPublicId: string
  companyPublicId: string
  companyCode: string
  roles: string[]
  permissionSets: string[]
  /** Canonical permission list used by hasPermission/hasAny/hasAll. */
  permissions: string[]
  scopes: Array<{ type: string; publicId: string }>
  enabledFeatures: string[]
  /** Raw employee access payload (company sessions). */
  employeeUuid?: string
  loginEnabled?: boolean
  /** Alias of permissions for the employee /access endpoint shape. */
  effectivePermissions?: string[]
}

type AccessState = {
  access: EffectiveAccess | null
  /** Lifecycle of the access payload: gates render loading UI until `loaded`. */
  accessStatus: AccessStatus
  /**
   * Granted permission codes normalized once per payload (O(1) lookups).
   * Stable empty-set reference while no access is loaded.
   */
  permissionsSet: ReadonlySet<string>
  setAccess: (access: EffectiveAccess) => void
  setAccessLoading: () => void
  setAccessError: () => void
  clearAccess: () => void
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
  hasFeature: (feature: string) => boolean
}

export type AccessStatus = "idle" | "loading" | "loaded" | "error"

/**
 * Normalize the self access endpoint payload (GET /api/v1/me/access) into
 * the shared EffectiveAccess shape so all permission checks keep working.
 */
export function normalizeMyAccess(access: MyAccessResponse): EffectiveAccess {
  return {
    userPublicId: access.userPublicId,
    companyPublicId: access.companyPublicId,
    companyCode: access.companyCode ?? "",
    roles: access.roles ?? [],
    permissionSets: access.permissionSets ?? [],
    permissions: access.permissions ?? [],
    scopes: access.scopes ?? [],
    enabledFeatures: access.enabledFeatures ?? [],
  }
}

/**
 * Normalize the employee access endpoint payload
 * (GET /companies/{companyUuid}/employees/{employeeUuid}/access) into the
 * shared EffectiveAccess shape so all permission checks keep working.
 *
 * @deprecated No longer used — access is fetched via GET /api/v1/me/access.
 */
export function normalizeEmployeeAccess(
  companyUuid: string,
  access: EmployeeAccessResponse
): EffectiveAccess {
  return {
    userPublicId: access.employeeUuid,
    companyPublicId: companyUuid,
    companyCode: "",
    roles: access.roles ?? [],
    permissionSets: access.permissionSets ?? [],
    permissions: access.effectivePermissions ?? [],
    scopes: [],
    enabledFeatures: [],
    employeeUuid: access.employeeUuid,
    loginEnabled: access.loginEnabled,
    effectivePermissions: access.effectivePermissions ?? [],
  }
}

function allPermissions(access: EffectiveAccess | null): string[] {
  if (!access) return []
  // `permissions` is canonical; `effectivePermissions` is kept for the
  // legacy employee-access shape — merge defensively for mixed payloads.
  if (access.effectivePermissions?.length) {
    return Array.from(
      new Set([...access.permissions, ...access.effectivePermissions])
    )
  }
  return access.permissions
}

const EMPTY_PERMISSIONS_SET: ReadonlySet<string> = new Set()

function toPermissionsSet(access: EffectiveAccess): ReadonlySet<string> {
  const set = new Set<string>()
  for (const code of allPermissions(access)) {
    if (typeof code === "string" && code.trim()) {
      set.add(normalizePermissionCode(code))
    }
  }
  return set
}

export const useAccessStore = create<AccessState>()((set, get) => ({
  access: null,
  accessStatus: "idle",
  permissionsSet: EMPTY_PERMISSIONS_SET,
  setAccess: (access) =>
    set({ access, accessStatus: "loaded", permissionsSet: toPermissionsSet(access) }),
  setAccessLoading: () => set({ accessStatus: "loading" }),
  setAccessError: () => set({ accessStatus: "error" }),
  clearAccess: () =>
    set({ access: null, accessStatus: "idle", permissionsSet: EMPTY_PERMISSIONS_SET }),
  hasPermission: (permission) => {
    return get().permissionsSet.has(normalizePermissionCode(permission))
  },
  hasAnyPermission: (permissions) => {
    const granted = get().permissionsSet
    if (!granted.size) return false
    return permissions.some((p) => granted.has(normalizePermissionCode(p)))
  },
  hasAllPermissions: (permissions) => {
    const granted = get().permissionsSet
    if (!granted.size) return false
    return permissions.every((p) => granted.has(normalizePermissionCode(p)))
  },
  hasFeature: (feature) => {
    const { access } = get()
    return access?.enabledFeatures.includes(feature) ?? false
  },
}))
