"use client"

import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react"

import { useAccessStore } from "@/stores/access-store"
import { useIsAllowed } from "@/hooks/use-permission"
import {
  buildPermissionCode,
  resolveRequiredCode,
  type RequiredPermission,
} from "@/lib/permissions"

export type PermissionGateRequire = "any" | "all"

/**
 * Declarative permission wrapper.
 *
 * ```tsx
 * <PermissionGate permission="USER.VIEW"><UsersPage /></PermissionGate>
 * <PermissionGate module="USER" action="CREATE"><CreateUserButton /></PermissionGate>
 * <PermissionGate permissions={["USER.UPDATE", "USER_STATUS"]} require="any">…</PermissionGate>
 * <PermissionGate permission="USER_EXPORT" mode="disabled"><ExportButton /></PermissionGate>
 * ```
 *
 * Modes:
 * - `hidden` (default): renders `fallback` (default `null`) when denied.
 * - `disabled`: clones a single element child with `disabled` + tooltip, or
 *   use a render-prop child `(allowed) => …` for full control.
 *
 * While permissions are loading, renders `loadingFallback` (default `null`) —
 * never forbidden UI. If the access fetch failed, fails open (renders
 * children) per the app's "don't lock the user out" policy; backend APIs
 * still enforce authorization.
 */
export function PermissionGate({
  permission,
  permissions,
  module,
  action,
  require = "any",
  mode = "hidden",
  fallback = null,
  loadingFallback = null,
  disabledReason,
  children,
}: {
  permission?: string
  permissions?: readonly RequiredPermission[]
  module?: string
  action?: string
  require?: PermissionGateRequire
  mode?: "hidden" | "disabled"
  fallback?: ReactNode
  loadingFallback?: ReactNode
  disabledReason?: string
  children: ReactNode | ((allowed: boolean) => ReactNode)
}) {
  // Narrow store subscriptions: no re-render on unrelated store changes.
  const accessStatus = useAccessStore((state) => state.accessStatus)
  const allowed = useIsAllowed({ permission, permissions, module, action, require })

  if (accessStatus === "idle" || accessStatus === "loading") {
    return <>{loadingFallback}</>
  }

  // Fail open when the access payload could not be loaded: the backend
  // remains the authorization authority for every API call.
  if (accessStatus === "error") {
    return <>{typeof children === "function" ? children(true) : children}</>
  }

  if (typeof children === "function") {
    return <>{children(allowed)}</>
  }

  if (allowed) {
    return <>{children}</>
  }

  if (mode === "disabled" && isValidElement(children)) {
    const child = children as ReactElement<{
      disabled?: boolean
      title?: string
      "aria-disabled"?: boolean
    }>
    return cloneElement(child, {
      disabled: true,
      "aria-disabled": true,
      title: disabledReason ?? child.props.title,
    })
  }

  return <>{fallback}</>
}

/** Helpers for non-component call sites (e.g. sidebar filtering). */
export { buildPermissionCode, resolveRequiredCode }
