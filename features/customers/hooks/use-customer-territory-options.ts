"use client"

import { useQuery } from "@tanstack/react-query"
import { getGeographies } from "@/features/geographies/api/geography.api"
import { geographyKeys } from "@/features/geographies/api/geography-keys"
import type { GeographyResponse } from "@/features/geographies/api/geography.types"

const PAGE_SIZE = 100

/**
 * Every ACTIVE territory of the company.
 *
 * The geography list endpoint caps `size` at 100, but the customer screens need
 * a complete uuid → name map for display (pincode mappings, territory labels),
 * so this walks the pages instead of showing raw uuids for the overflow.
 * Uses a `geographyKeys.list` key so existing geography invalidations apply.
 */
export function useCustomerTerritoryOptions(companyUuid: string) {
  return useQuery({
    queryKey: geographyKeys.list(companyUuid, {
      type: "TERRITORY",
      status: "ACTIVE",
      allPages: true,
    }),
    queryFn: async () => {
      const rows: GeographyResponse[] = []
      for (let page = 0; page < 200; page += 1) {
        const response = await getGeographies(companyUuid, {
          type: "TERRITORY",
          status: "ACTIVE",
          page,
          size: PAGE_SIZE,
        })
        rows.push(...response.content)
        const totalPages = response.totalPages ?? 0
        if (
          response.content.length === 0 ||
          page + 1 >= totalPages ||
          page + 1 >= 200
        ) {
          break
        }
      }
      return rows
    },
    enabled: !!companyUuid,
    staleTime: 5 * 60_000,
  })
}
