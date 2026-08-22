"use client"

import { useQuery } from "@tanstack/react-query"
import { getUserEffectiveAccess } from "../api/user.api"
import { userKeys } from "../api/user-keys"

export function useEffectiveAccess(companyUuid: string, userUuid: string) {
  return useQuery({
    queryKey: userKeys.effectiveAccess(companyUuid, userUuid),
    queryFn: () => getUserEffectiveAccess(companyUuid, userUuid),
    enabled: !!companyUuid && !!userUuid,
  })
}
