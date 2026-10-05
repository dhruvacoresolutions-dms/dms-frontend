"use client"

import { useQuery } from "@tanstack/react-query"
import { getGstTaxStructure } from "../api/gst-tax-structures.api"
import { gstTaxStructureKeys } from "../api/gst-tax-structures-keys"

export function useGstTaxStructure(
  companyUuid: string,
  taxStructureUuid: string
) {
  return useQuery({
    queryKey: gstTaxStructureKeys.detail(companyUuid, taxStructureUuid),
    queryFn: () => getGstTaxStructure(companyUuid, taxStructureUuid),
    enabled: !!companyUuid && !!taxStructureUuid,
  })
}
