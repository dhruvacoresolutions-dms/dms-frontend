"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createGstHsn } from "../api/gst-hsn.api"
import { gstHsnKeys } from "../api/gst-hsn-keys"
import type { CreateGstHsnRequest } from "../api/gst-hsn.types"

export function useCreateGstHsn(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateGstHsnRequest) =>
      createGstHsn(companyUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: gstHsnKeys.lists(companyUuid),
      })
    },
  })
}
