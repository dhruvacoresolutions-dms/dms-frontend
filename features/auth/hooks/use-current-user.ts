"use client"

import { useQuery } from "@tanstack/react-query"
import { getCurrentUser } from "../api/auth.api"
import { authKeys } from "../api/auth-keys"
import { useAuthStore } from "@/stores/auth-store"

/**
 * Opt-in hook to re-sync profile from GET /v1/auth/me.
 * Prefer reading `useAuthStore(s => s.session?.user)` directly — the login
 * response already persists `AuthSession.user` in the session (stores/auth-store.ts:14).
 * Only use this when you need to force a fresh fetch (e.g. after profile edit).
 */
export function useCurrentUser(options?: { enabled?: boolean }) {
  const session = useAuthStore((state) => state.session)

  return useQuery({
    queryKey: authKeys.me(),
    queryFn: getCurrentUser,
    enabled: !!session?.accessToken && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000,
  })
}
