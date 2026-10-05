"use client"

import { useQuery } from "@tanstack/react-query"
import { getGstTaxStructures } from "../api/gst-tax-structures.api"
import { gstTaxStructureKeys } from "../api/gst-tax-structures-keys"
import type { GstTaxStructureListParams } from "../api/gst-tax-structures.types"

export function useGstTaxStructures(
  companyUuid: string,
  params?: GstTaxStructureListParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: gstTaxStructureKeys.list(companyUuid, params),
    queryFn: () => getGstTaxStructures(companyUuid, params),
    enabled: !!companyUuid && (options?.enabled ?? true),
  })
}
