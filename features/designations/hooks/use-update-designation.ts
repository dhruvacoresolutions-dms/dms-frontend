"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateDesignation } from "../api/designation.api"
import { designationKeys } from "../api/designation-keys"
import type { UpdateDesignationRequest } from "../api/designation.types"

export function useUpdateDesignation(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      designationUuid,
      input,
    }: {
      designationUuid: string
      input: UpdateDesignationRequest
    }) => updateDesignation(companyUuid, designationUuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: designationKeys.lists(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: designationKeys.detail(companyUuid, variables.designationUuid),
      })
    },
  })
}
