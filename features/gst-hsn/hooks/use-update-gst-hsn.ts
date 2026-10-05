"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateGstHsn } from "../api/gst-hsn.api"
import { gstHsnKeys } from "../api/gst-hsn-keys"
import type { UpdateGstHsnRequest } from "../api/gst-hsn.types"

export function useUpdateGstHsn(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      hsnUuid,
      input,
    }: {
      hsnUuid: string
      input: UpdateGstHsnRequest
    }) => updateGstHsn(companyUuid, hsnUuid, input),
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
