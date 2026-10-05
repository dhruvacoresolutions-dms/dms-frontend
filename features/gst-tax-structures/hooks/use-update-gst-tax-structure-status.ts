"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateGstTaxStructureStatus } from "../api/gst-tax-structures.api"
import { gstTaxStructureKeys } from "../api/gst-tax-structures-keys"
import type { UpdateGstTaxStructureStatusRequest } from "../api/gst-tax-structures.types"

export function useUpdateGstTaxStructureStatus(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      taxStructureUuid,
      input,
    }: {
      taxStructureUuid: string
      input: UpdateGstTaxStructureStatusRequest
    }) => updateGstTaxStructureStatus(companyUuid, taxStructureUuid, input),
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
