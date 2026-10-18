"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createGstTaxCodeVersion } from "../api/gst-tax-code.api"
import { gstTaxCodeKeys } from "../api/gst-tax-code-keys"
import type { CreateGstTaxCodeVersionRequest } from "../api/gst-tax-code.types"

export function useCreateGstTaxCodeVersion(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      taxCode,
      input,
    }: {
      taxCode: string
      input: CreateGstTaxCodeVersionRequest
    }) => createGstTaxCodeVersion(companyUuid, taxCode, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: gstTaxCodeKeys.lists(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: gstTaxCodeKeys.versions(companyUuid, variables.taxCode),
      })
    },
  })
}
