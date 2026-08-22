"use client"

import { useQuery } from "@tanstack/react-query"
import { getUser } from "../api/user.api"
import { userKeys } from "../api/user-keys"

export function useUser(companyUuid: string, userUuid: string) {
  return useQuery({
    queryKey: userKeys.detail(companyUuid, userUuid),
    queryFn: () => getUser(companyUuid, userUuid),
    enabled: !!companyUuid && !!userUuid,
  })
}
