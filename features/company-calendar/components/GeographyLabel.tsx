"use client"

import { useQuery } from "@tanstack/react-query"

import { Skeleton } from "@/components/ui/skeleton"
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
    return (
      <span className="inline-flex items-center" aria-busy="true">
        <span className="sr-only">Loading geography</span>
        <Skeleton className="h-4 w-24" />
      </span>
    )
  }
  if (!data) {
    return <span className="text-muted-foreground">—</span>
  }
  return <span title={data.code}>{data.name || data.code || "—"}</span>
}
