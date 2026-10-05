"use client"

import { useQuery } from "@tanstack/react-query"
import { getGstHsns } from "../api/gst-hsn.api"
import { gstHsnKeys } from "../api/gst-hsn-keys"
import type { GstHsnListParams } from "../api/gst-hsn.types"

export function useGstHsns(
  companyUuid: string,
  params?: GstHsnListParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: gstHsnKeys.list(companyUuid, params),
    queryFn: () => getGstHsns(companyUuid, params),
    enabled: !!companyUuid && (options?.enabled ?? true),
  })
}
