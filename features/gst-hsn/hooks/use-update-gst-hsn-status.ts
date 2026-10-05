"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateGstHsnStatus } from "../api/gst-hsn.api"
import { gstHsnKeys } from "../api/gst-hsn-keys"
import type { UpdateGstHsnStatusRequest } from "../api/gst-hsn.types"

export function useUpdateGstHsnStatus(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      hsnUuid,
      input,
    }: {
      hsnUuid: string
      input: UpdateGstHsnStatusRequest
    }) => updateGstHsnStatus(companyUuid, hsnUuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: gstHsnKeys.lists(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: gstHsnKeys.detail(companyUuid, variables.hsnUuid),
      })
    },
  })
}
