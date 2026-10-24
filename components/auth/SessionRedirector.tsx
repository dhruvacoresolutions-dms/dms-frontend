"use client"

import { useEffect, useSyncExternalStore } from "react"
import { usePathname, useRouter } from "next/navigation"

import { AuthLoadingScreen } from "@/components/auth/AuthLoadingScreen"
import {
  clearRedirectRequest,
  getRedirectRequest,
  subscribeRedirects,
} from "@/lib/unauthorized-handler"

const getServerSnapshot = () => null

/**
 * Applies session redirects (401 / password-change-required) through the Next
 * router instead of a full page reload. Mounted once in the root layout.
 */
export function SessionRedirector() {
  const router = useRouter()
  const pathname = usePathname()
  const request = useSyncExternalStore(
    subscribeRedirects,
    getRedirectRequest,
    getServerSnapshot
  )

  const isAlreadyOnTarget =
    !!request && pathname === request.target.split("?")[0]

  useEffect(() => {
    if (!request || isAlreadyOnTarget) {
      return
    }

    router.replace(request.target)

    // Fallback for the (rare) case where navigation does not change pathname
    // (e.g. same route with a different query string).
    const timer = setTimeout(() => clearRedirectRequest(), 2_000)

    return () => clearTimeout(timer)
  }, [request, isAlreadyOnTarget, router])

  // Clear after navigation so a later route change cannot replay the redirect.
  useEffect(() => {
    if (!request || !isAlreadyOnTarget) {
      return
    }

    const timer = setTimeout(() => clearRedirectRequest(), 0)

    return () => clearTimeout(timer)
  }, [request, isAlreadyOnTarget])

  if (!request || isAlreadyOnTarget) {
    return null
  }

  return <AuthLoadingScreen variant={request.variant} />
}
