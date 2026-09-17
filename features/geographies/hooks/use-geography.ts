"use client"

import { useQuery } from "@tanstack/react-query"
import { getGeography } from "../api/geography.api"
import { geographyKeys } from "../api/geography-keys"

export function useGeography(companyUuid: string, geographyUuid: string) {
  return useQuery({
    queryKey: geographyKeys.detail(companyUuid, geographyUuid),
    queryFn: () => getGeography(companyUuid, geographyUuid),
    enabled: !!companyUuid && !!geographyUuid,
  })
}
