"use client"

import { useMemo } from "react"
import { useAccessStore } from "@/stores/access-store"
import {
  createPermissionChecker,
  type PermissionChecker,
  type RequiredPermission,
} from "@/lib/permissions/checker"

export type UsePermissionResult = PermissionChecker & {
  /**
   * True once the access payload has loaded (successfully or not — see
   * `accessStatus` for the distinction). Gates must not render forbidden UI
   * while this is false.
   */
  isLoaded: boolean
  /** Raw granted codes as received from the backend (unnormalized). */
  permissions: string[]
}

/**
 * Primary permission API for components.
 *
 * ```tsx
 * const { can, canAny, canAll, isLoaded } = usePermission()
 * if (can("USER", "DELETE")) …
 * ```
 *
 * Subscribes to narrow store slices so unrelated session changes don't
 * re-render consumers. Returned functions are referentially stable per
 * access payload.
 */
export function usePermission(): UsePermissionResult {
  const permissions = useAccessStore((state) => state.access?.permissions)
  const accessStatus = useAccessStore((state) => state.accessStatus)

  return useMemo<UsePermissionResult>(() => {
    const checker = createPermissionChecker(permissions)
    return {
      ...checker,
      isLoaded: accessStatus === "loaded" || accessStatus === "error",
      permissions: permissions ?? [],
    }
  }, [permissions, accessStatus])
}

export type { RequiredPermission }

export type GateRequirement = {
  permission?: string
  permissions?: readonly RequiredPermission[]
  module?: string
  action?: string
  require?: "any" | "all"
}

/**
 * Shared allow/deny decision used by `PermissionGate` and `RouteGate`.
 * Returns false while access is missing; callers handle loading/error states.
 */
export function useIsAllowed({
  permission,
  permissions,
  module,
  action,
  require = "any",
}: GateRequirement): boolean {
  const permissionsSet = useAccessStore((state) => state.permissionsSet)

  return useMemo(() => {
    const checker = createPermissionChecker(permissionsSet)
    if (permission) return checker.has(permission)
    if (permissions && permissions.length > 0) {
      return require === "all"
        ? checker.canAll(permissions)
        : checker.canAny(permissions)
    }
    if (module) {
      return action ? checker.can(module, action) : checker.can(module)
    }
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[permissions] No permission, permissions, or module specified — denying by default."
      )
    }
    return false
  }, [permissionsSet, permission, permissions, module, action, require])
}
