"use client"

import { useQuery } from "@tanstack/react-query"
import { getGstHsn } from "../api/gst-hsn.api"
import { gstHsnKeys } from "../api/gst-hsn-keys"

export function useGstHsn(companyUuid: string, hsnUuid: string) {
  return useQuery({
    queryKey: gstHsnKeys.detail(companyUuid, hsnUuid),
    queryFn: () => getGstHsn(companyUuid, hsnUuid),
    enabled: !!companyUuid && !!hsnUuid,
  })
}
