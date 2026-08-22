"use client"

import { useQuery } from "@tanstack/react-query"
import { getCurrentAccess } from "../api/auth.api"
import { authKeys } from "../api/auth-keys"
import { useAuthStore } from "@/stores/auth-store"

export function useCurrentAccess() {
  const session = useAuthStore((state) => state.session)

  return useQuery({
    queryKey: authKeys.access(),
    queryFn: getCurrentAccess,
    enabled: !!session?.accessToken && !!session?.user?.companyUuid,
    staleTime: 5 * 60 * 1000,
  })
}
