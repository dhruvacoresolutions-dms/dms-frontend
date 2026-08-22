"use client"

import { useQuery } from "@tanstack/react-query"
import { getUsers } from "../api/user.api"
import { userKeys } from "../api/user-keys"
import type { UserListParams } from "../api/user.types"

export function useUsers(companyUuid: string, params?: UserListParams) {
  return useQuery({
    queryKey: userKeys.list(companyUuid, params),
    queryFn: () => getUsers(companyUuid, params),
    enabled: !!companyUuid,
  })
}
