"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createDesignation } from "../api/designation.api"
import { designationKeys } from "../api/designation-keys"
import type { CreateDesignationRequest } from "../api/designation.types"

export function useCreateDesignation(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateDesignationRequest) =>
      createDesignation(companyUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: designationKeys.lists(companyUuid),
      })
    },
  })
}
