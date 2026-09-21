"use client"

import { create } from "zustand"
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
  setAccess: (access: EffectiveAccess) => void
  clearAccess: () => void
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
  hasFeature: (feature: string) => boolean
}

/**
 * Normalize the self access endpoint payload (GET /api/v1/me/access) into
 * the shared EffectiveAccess shape so all permission checks keep working.
 */
export function normalizeMyAccess(access: MyAccessResponse): EffectiveAccess {
  return {
    userPublicId: access.userUuid,
    companyPublicId: access.companyUuid,
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
  // employee-access shape — merge defensively for mixed payloads.
  if (access.effectivePermissions?.length) {
    return Array.from(
      new Set([...access.permissions, ...access.effectivePermissions])
    )
  }
  return access.permissions
}

export const useAccessStore = create<AccessState>()((set, get) => ({
  access: null,
  setAccess: (access) => set({ access }),
  clearAccess: () => set({ access: null }),
  hasPermission: (permission) => {
    const { access } = get()
    return allPermissions(access).includes(permission)
  },
  hasAnyPermission: (permissions) => {
    const perms = allPermissions(get().access)
    if (!perms.length) return false
    return permissions.some((p) => perms.includes(p))
  },
  hasAllPermissions: (permissions) => {
    const perms = allPermissions(get().access)
    if (!perms.length) return false
    return permissions.every((p) => perms.includes(p))
  },
  hasFeature: (feature) => {
    const { access } = get()
    return access?.enabledFeatures.includes(feature) ?? false
  },
}))
