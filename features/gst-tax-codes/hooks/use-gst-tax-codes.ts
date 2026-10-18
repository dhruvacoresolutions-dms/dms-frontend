"use client"

import { useQuery } from "@tanstack/react-query"
import { getGstTaxCodes } from "../api/gst-tax-code.api"
import { gstTaxCodeKeys } from "../api/gst-tax-code-keys"
import type { GstTaxCodeListParams } from "../api/gst-tax-code.types"

export function useGstTaxCodes(
  companyUuid: string,
  params?: GstTaxCodeListParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: gstTaxCodeKeys.list(companyUuid, params),
    queryFn: () => getGstTaxCodes(companyUuid, params),
    enabled: !!companyUuid && (options?.enabled ?? true),
  })
}
