"use client"

import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"

import {
  startSessionTracker,
  stopSessionTracker,
} from "@/lib/session-tracker"
import { clearSessionCookie, hasSessionCookie } from "@/lib/session"
import {
  handlePasswordChangeRequired,
  requestRedirect,
} from "@/lib/unauthorized-handler"
import { useAuthStore } from "@/stores/auth-store"
import { getCurrentUser } from "../api/auth.api"
import { authKeys } from "../api/auth-keys"

/**
 * Session lifecycle:
 * - one `/auth/me` validation per app start (never polled) — 401 lands on
 *   login via the shared interceptor;
 * - starts the interaction-driven renewal tracker while a session exists.
 */
export function useSessionLifecycle() {
  const hasToken = useAuthStore((state) => !!state.session?.accessToken)
  const updateUser = useAuthStore((state) => state.updateUser)

  const bootCheck = useQuery({
    queryKey: authKeys.me(),
    queryFn: getCurrentUser,
    enabled: hasToken,
    retry: false,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  useEffect(() => {
    if (!bootCheck.data) {
      return
    }

    // Refresh the persisted profile from the server once per app load.
    updateUser(bootCheck.data)

    // An admin may have forced a password change mid-session.
    if (bootCheck.data.mustChangePassword) {
      handlePasswordChangeRequired()
    }
  }, [bootCheck.data, updateUser])

  useEffect(() => {
    if (!hasToken) {
      stopSessionTracker()
      return
    }

    startSessionTracker()

    return () => stopSessionTracker()
  }, [hasToken])

  useEffect(() => {
    if (hasToken) {
      return
    }

    // `persist` hydrates from localStorage after the first client render, and
    // during that hydration pass the selector still returns the server
    // snapshot (`null`). Read the live store before treating the cookie as
    // stale — otherwise a normal reload would wipe a valid session and bounce
    // the user to login.
    if (!useAuthStore.persist.hasHydrated()) {
      return
    }

    if (useAuthStore.getState().session) {
      return
    }

    // Genuinely stale presence cookie (e.g. localStorage was cleared): the
    // middleware guard would keep the app shell up forever, so clear it and
    // restart at login.
    if (hasSessionCookie()) {
      clearSessionCookie()
      requestRedirect({ target: "/login", variant: "loading" })
    }
  }, [hasToken])
}
