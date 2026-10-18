"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { patchGstTaxCodeVersion } from "../api/gst-tax-code.api"
import { gstTaxCodeKeys } from "../api/gst-tax-code-keys"
import type { PatchGstTaxCodeVersionRequest } from "../api/gst-tax-code.types"

export function usePatchGstTaxCodeVersion(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      versionUuid,
      input,
    }: {
      versionUuid: string
      input: PatchGstTaxCodeVersionRequest
      /** Optional: also invalidate that code's version list. */
      taxCode?: string
    }) => patchGstTaxCodeVersion(companyUuid, versionUuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: gstTaxCodeKeys.lists(companyUuid),
      })
      if (variables.taxCode) {
        queryClient.invalidateQueries({
          queryKey: gstTaxCodeKeys.versions(companyUuid, variables.taxCode),
        })
      }
    },
  })
}
