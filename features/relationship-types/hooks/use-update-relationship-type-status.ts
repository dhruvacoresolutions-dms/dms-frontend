"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateRelationshipTypeStatus } from "../api/relationship-type.api"
import { relationshipTypeKeys } from "../api/relationship-type-keys"
import type { UpdateRelationshipTypeStatusRequest } from "../api/relationship-type.types"

export function useUpdateRelationshipTypeStatus(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      relationshipTypeUuid,
      input,
    }: {
      relationshipTypeUuid: string
      input: UpdateRelationshipTypeStatusRequest
    }) =>
      updateRelationshipTypeStatus(companyUuid, relationshipTypeUuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: relationshipTypeKeys.lists(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: relationshipTypeKeys.detail(
          companyUuid,
          variables.relationshipTypeUuid
        ),
      })
    },
  })
}
