"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateUser } from "../api/user.api"
import { userKeys } from "../api/user-keys"
import type { UpdateUserRequest } from "../api/user.types"

export function useUpdateUser(companyUuid: string, userUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateUserRequest) =>
      updateUser(companyUuid, userUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists(companyUuid) })
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(companyUuid, userUuid),
      })
    },
  })
}
