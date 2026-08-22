"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateDesignationStatus } from "../api/designation.api"
import { designationKeys } from "../api/designation-keys"
import type { UpdateDesignationStatusRequest } from "../api/designation.types"

export function useUpdateDesignationStatus(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      designationUuid,
      input,
    }: {
      designationUuid: string
      input: UpdateDesignationStatusRequest
    }) => updateDesignationStatus(companyUuid, designationUuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: designationKeys.lists(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: designationKeys.detail(
          companyUuid,
          variables.designationUuid
        ),
      })
    },
  })
}
