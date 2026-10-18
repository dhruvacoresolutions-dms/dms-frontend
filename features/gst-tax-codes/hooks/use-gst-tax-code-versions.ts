"use client"

import { useQuery } from "@tanstack/react-query"
import { getGstTaxCodeVersions } from "../api/gst-tax-code.api"
import { gstTaxCodeKeys } from "../api/gst-tax-code-keys"

export function useGstTaxCodeVersions(
  companyUuid: string,
  taxCode: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: gstTaxCodeKeys.versions(companyUuid, taxCode),
    queryFn: () => getGstTaxCodeVersions(companyUuid, taxCode),
    enabled: !!companyUuid && !!taxCode && (options?.enabled ?? true),
  })
}
