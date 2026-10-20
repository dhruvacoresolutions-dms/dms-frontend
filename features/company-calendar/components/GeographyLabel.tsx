"use client"

import { useQuery } from "@tanstack/react-query"

import { getGeography } from "@/features/geographies/api/geography.api"
import { geographyKeys } from "@/features/geographies/api/geography-keys"

type GeographyLabelProps = {
  companyUuid: string
  geographyUuid?: string | null
}

/**
 * Renders the holiday's geography name. `null` means the holiday applies to
 * the whole company. The lookup is cached by React Query per geography.
 */
export function GeographyLabel({
  companyUuid,
  geographyUuid,
}: GeographyLabelProps) {
  const { data, isLoading } = useQuery({
    queryKey: geographyKeys.detail(companyUuid, geographyUuid ?? ""),
    queryFn: () => getGeography(companyUuid, geographyUuid as string),
    enabled: !!companyUuid && !!geographyUuid,
    staleTime: 5 * 60 * 1000,
  })

  if (!geographyUuid) {
    return <span className="text-muted-foreground">Company-wide</span>
  }
  if (isLoading) {
    return <span className="text-muted-foreground">Loading…</span>
  }
  if (!data) {
    return (
      <span className="text-muted-foreground" title={geographyUuid}>
        Specific geography
      </span>
    )
  }
  return <span title={data.code}>{data.name}</span>
}
