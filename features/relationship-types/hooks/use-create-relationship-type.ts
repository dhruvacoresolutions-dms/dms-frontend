"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createRelationshipType } from "../api/relationship-type.api"
import { relationshipTypeKeys } from "../api/relationship-type-keys"
import type { CreateRelationshipTypeRequest } from "../api/relationship-type.types"

export function useCreateRelationshipType(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateRelationshipTypeRequest) =>
      createRelationshipType(companyUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: relationshipTypeKeys.lists(companyUuid),
      })
    },
  })
}
