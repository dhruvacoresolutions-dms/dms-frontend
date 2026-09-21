"use client"

import { useQuery } from "@tanstack/react-query"
import { getCurrentAccess } from "../api/auth.api"
import { authKeys } from "../api/auth-keys"
import { useAuthStore } from "@/stores/auth-store"

export function useCurrentAccess() {
  const companyUuid = useAuthStore((state) => state.session?.user?.companyUuid)
  const userUuid = useAuthStore((state) => state.session?.user?.userUuid)
  const hasToken = useAuthStore((state) => !!state.session?.accessToken)

  return useQuery({
    queryKey: authKeys.access(companyUuid, userUuid),
    queryFn: getCurrentAccess,
    enabled: hasToken,
    // Access is session-scoped and already derived from login — cache it for the whole session.
    // Route changes in TopBar/SiteHeader must NOT trigger a refetch.
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}
