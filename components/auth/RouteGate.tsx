"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useAccessStore } from "@/stores/access-store"
import { useIsAllowed, type GateRequirement } from "@/hooks/use-permission"
import { AuthLoadingScreen } from "@/components/auth/AuthLoadingScreen"
import { ForbiddenState } from "@/components/common/ForbiddenState"

/**
 * Page-level protection. Wrap page content to guard direct URL access,
 * refresh, and client-side navigation:
 *
 * ```tsx
 * <RouteGate permission="USER.VIEW"><UsersContent /></RouteGate>
 * ```
 *
 * Behavior:
 * - access loading → full-screen loader (never a forbidden flash)
 * - access fetch failed → renders children (fail open; backend enforces)
 * - allowed → children
 * - denied → `ForbiddenState` in place (URL preserved), or redirect when
 *   `redirectTo` is set (e.g. `redirectTo="/forbidden"`).
 */
export function RouteGate({
  permission,
  permissions,
  module,
  action,
  require = "any",
  redirectTo,
  loadingFallback,
  forbiddenTitle,
  forbiddenDescription,
  children,
}: GateRequirement & {
  redirectTo?: string
  loadingFallback?: React.ReactNode
  forbiddenTitle?: string
  forbiddenDescription?: string
  children: React.ReactNode
}) {
  const accessStatus = useAccessStore((state) => state.accessStatus)
  const allowed = useIsAllowed({ permission, permissions, module, action, require })
  const router = useRouter()

  const shouldRedirect = accessStatus === "loaded" && !allowed && !!redirectTo

  useEffect(() => {
    if (shouldRedirect && redirectTo) {
      router.replace(redirectTo)
    }
  }, [shouldRedirect, redirectTo, router])

  if (accessStatus === "idle" || accessStatus === "loading") {
    // Refresh / navigation path: neutral "Loading..." copy — never the
    // "Signing you in…" login copy.
    return <>{loadingFallback ?? <AuthLoadingScreen variant="loading" />}</>
  }

  // Fail open when the access payload could not be loaded.
  if (accessStatus === "error") {
    return <>{children}</>
  }

  if (allowed) {
    return <>{children}</>
  }

  if (redirectTo) {
    return <>{loadingFallback ?? null}</>
  }

  return (
    <ForbiddenState title={forbiddenTitle} description={forbiddenDescription} />
  )
}
