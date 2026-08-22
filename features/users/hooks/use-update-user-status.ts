"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateUserStatus } from "../api/user.api"
import { userKeys } from "../api/user-keys"
import type { UpdateUserStatusRequest } from "../api/user.types"

export function useUpdateUserStatus(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      userUuid,
      input,
    }: {
      userUuid: string
      input: UpdateUserStatusRequest
    }) => updateUserStatus(companyUuid, userUuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists(companyUuid) })
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(companyUuid, variables.userUuid),
      })
    },
  })
}
