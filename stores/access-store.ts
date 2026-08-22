"use client"

import { create } from "zustand"

export type EffectiveAccess = {
  userPublicId: string
  companyPublicId: string
  companyCode: string
  roles: string[]
  permissionSets: string[]
  permissions: string[]
  scopes: Array<{ type: string; publicId: string }>
  enabledFeatures: string[]
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

export const useAccessStore = create<AccessState>()((set, get) => ({
  access: null,
  setAccess: (access) => set({ access }),
  clearAccess: () => set({ access: null }),
  hasPermission: (permission) => {
    const { access } = get()
    return access?.permissions.includes(permission) ?? false
  },
  hasAnyPermission: (permissions) => {
    const { access } = get()
    if (!access) return false
    return permissions.some((p) => access.permissions.includes(p))
  },
  hasAllPermissions: (permissions) => {
    const { access } = get()
    if (!access) return false
    return permissions.every((p) => access.permissions.includes(p))
  },
  hasFeature: (feature) => {
    const { access } = get()
    return access?.enabledFeatures.includes(feature) ?? false
  },
}))
