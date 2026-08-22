"use client"

import { useQuery } from "@tanstack/react-query"
import { getCurrentUser } from "../api/auth.api"
import { authKeys } from "../api/auth-keys"
import { useAuthStore } from "@/stores/auth-store"

export function useCurrentUser() {
  const session = useAuthStore((state) => state.session)

  return useQuery({
    queryKey: authKeys.me(),
    queryFn: getCurrentUser,
    enabled: !!session?.accessToken,
    staleTime: 5 * 60 * 1000,
  })
}
