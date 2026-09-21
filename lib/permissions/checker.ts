/**
 * Pure permission checker — no React, no store access, fully unit-testable.
 *
 * Granted codes are normalized once into a `Set` (O(1) lookups). Required
 * codes accept backend form (`USER_VIEW`), dot form (`USER.VIEW`), or
 * module/action refs (`{ module: "USER", action: "EDIT" }` → `USER_UPDATE`).
 */
import {
  buildPermissionCode,
  normalizePermissionCode,
  type ModuleActionRef,
} from "./permissions"

export type RequiredPermission = string | ModuleActionRef

export type PermissionChecker = {
  /** Exact-code check: `has("USER_VIEW")` / `has("USER.VIEW")`. */
  has: (permission: string) => boolean
  /**
   * Module/action check: `can("USER", "DELETE")`.
   * With no action, `can("USER")` is true when ANY `USER_*` code is granted.
   */
  can: (module: string, action?: string) => boolean
  /** True when ANY of the given permissions is granted. Empty input → false. */
  canAny: (permissions: readonly RequiredPermission[]) => boolean
  /** True when ALL of the given permissions are granted. Empty input → false. */
  canAll: (permissions: readonly RequiredPermission[]) => boolean
  /** Number of granted codes (0 when access is missing). */
  size: number
}

export function createPermissionChecker(
  granted: Iterable<string> | null | undefined
): PermissionChecker {
  const grantedSet = new Set<string>()
  if (granted) {
    for (const code of granted) {
      if (typeof code === "string" && code.trim()) {
        grantedSet.add(normalizePermissionCode(code))
      }
    }
  }

  const has = (permission: string): boolean => {
    if (!grantedSet.size) return false
    return grantedSet.has(normalizePermissionCode(permission))
  }

  const can = (module: string, action?: string): boolean => {
    if (!grantedSet.size) return false
    if (action === undefined) {
      const prefix = `${normalizePermissionCode(module)}_`
      for (const code of grantedSet) {
        if (code.startsWith(prefix)) return true
      }
      return false
    }
    return grantedSet.has(buildPermissionCode(module, action))
  }

  const check = (input: RequiredPermission): boolean =>
    typeof input === "string"
      ? has(input)
      : can(input.module, input.action)

  const canAny = (permissions: readonly RequiredPermission[]): boolean => {
    if (!grantedSet.size || permissions.length === 0) return false
    return permissions.some(check)
  }

  const canAll = (permissions: readonly RequiredPermission[]): boolean => {
    if (!grantedSet.size || permissions.length === 0) return false
    return permissions.every(check)
  }

  return { has, can, canAny, canAll, size: grantedSet.size }
}
