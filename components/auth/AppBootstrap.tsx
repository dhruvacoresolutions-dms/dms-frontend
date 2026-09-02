"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAccessStore } from "@/stores/access-store"
import { useCurrentAccess } from "@/features/auth/hooks/use-current-access"
import { useSessionExpiry } from "@/features/auth/hooks/use-session-expiry"
import { useAuthStore } from "@/stores/auth-store"

export function AppBootstrap({ children }: { children: React.ReactNode }) {
  const setAccess = useAccessStore((state) => state.setAccess)
  const session = useAuthStore((s) => s.session)
  const roles = session?.user?.roles ?? []
  const isPlatformAdmin = roles.includes("PLATFORM_ADMINISTRATOR")
  const pathname = usePathname()
  const router = useRouter()

  // User details are already persisted in AuthSession (stores/auth-store.ts:15)
  // from login response — no need to call GET /v1/auth/me on every load.
  // Use `useCurrentUser()` manually only when a fresh profile sync is needed.

  // BE timeout (401 or expiresAt) -> purge zustand + cookie + query cache + redirect.
  // This also handles idle timeout with no API calls (timer + visibility check).
  useSessionExpiry()

  const currentAccessQuery = useCurrentAccess()

  useEffect(() => {
    if (currentAccessQuery.data) {
      setAccess(currentAccessQuery.data)
    }
  }, [currentAccessQuery.data, setAccess])

  // Role-based route guard:
  // - PLATFORM_ADMINISTRATOR may only access /companies (and /profile); redirect others to /companies
  // - Non-admin may not access /companies; redirect to /dashboard
  useEffect(() => {
    if (!session) return
    const isCompaniesRoute = pathname === "/companies" || pathname.startsWith("/companies/")
    const isAllowedForAdmin = isCompaniesRoute || pathname.startsWith("/profile") || pathname.startsWith("/auth")
    if (isPlatformAdmin && !isAllowedForAdmin) {
      // Allow dashboard? Spec says only Companies visible for admin, so redirect even dashboard to companies
      router.replace("/companies")
      return
    }
    if (!isPlatformAdmin && isCompaniesRoute) {
      router.replace("/dashboard")
    }
  }, [session, isPlatformAdmin, pathname, router])

  return <>{children}</>
}
