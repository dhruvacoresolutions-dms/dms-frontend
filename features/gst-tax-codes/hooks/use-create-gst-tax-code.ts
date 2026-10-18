"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createGstTaxCode } from "../api/gst-tax-code.api"
import { gstTaxCodeKeys } from "../api/gst-tax-code-keys"
import type { CreateGstTaxCodeRequest } from "../api/gst-tax-code.types"

export function useCreateGstTaxCode(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateGstTaxCodeRequest) =>
      createGstTaxCode(companyUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: gstTaxCodeKeys.lists(companyUuid),
      })
    },
  })
}
