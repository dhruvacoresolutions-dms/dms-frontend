"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateGstTaxStructure } from "../api/gst-tax-structures.api"
import { gstTaxStructureKeys } from "../api/gst-tax-structures-keys"
import type { UpdateGstTaxStructureRequest } from "../api/gst-tax-structures.types"

export function useUpdateGstTaxStructure(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      taxStructureUuid,
      input,
    }: {
      taxStructureUuid: string
      input: UpdateGstTaxStructureRequest
    }) => updateGstTaxStructure(companyUuid, taxStructureUuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: gstTaxStructureKeys.lists(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: gstTaxStructureKeys.detail(
          companyUuid,
          variables.taxStructureUuid
        ),
      })
    },
  })
}
