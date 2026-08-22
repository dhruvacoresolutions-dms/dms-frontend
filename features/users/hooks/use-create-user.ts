"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createUser } from "../api/user.api"
import { userKeys } from "../api/user-keys"
import type { CreateUserRequest } from "../api/user.types"

export function useCreateUser(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateUserRequest) => createUser(companyUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists(companyUuid) })
    },
  })
}
