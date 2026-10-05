"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createGstTaxStructure } from "../api/gst-tax-structures.api"
import { gstTaxStructureKeys } from "../api/gst-tax-structures-keys"
import type { CreateGstTaxStructureRequest } from "../api/gst-tax-structures.types"

export function useCreateGstTaxStructure(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateGstTaxStructureRequest) =>
      createGstTaxStructure(companyUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: gstTaxStructureKeys.lists(companyUuid),
      })
    },
  })
}
