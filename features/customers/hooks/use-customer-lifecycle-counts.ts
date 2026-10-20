"use client"

import { useQueries } from "@tanstack/react-query"
import { getCustomers } from "../api/customer.api"
import { customerKeys } from "../api/customer-keys"
import type { CustomerLifecycleStatus } from "../api/customer.types"

export type CustomerLifecycleCounts = {
  total: number
  active: number
  submitted: number
  rework: number
}

const COUNTED_STATUSES: CustomerLifecycleStatus[] = [
  "ACTIVE",
  "SUBMITTED",
  "REWORK",
]

/**
 * KPI strip counts. One lightweight `size=1` page per bucket (the API returns
 * `totalElements`), shared through the query cache for a minute.
 */
export function useCustomerLifecycleCounts(companyUuid: string) {
  const results = useQueries({
    queries: [
      {
        queryKey: customerKeys.countList(companyUuid),
        queryFn: () => getCustomers(companyUuid, { page: 0, size: 1 }),
        enabled: !!companyUuid,
        staleTime: 60_000,
      },
      ...COUNTED_STATUSES.map((status) => ({
        queryKey: customerKeys.countList(companyUuid, status),
        queryFn: () =>
          getCustomers(companyUuid, {
            lifecycleStatus: status,
            page: 0,
            size: 1,
          }),
        enabled: !!companyUuid,
        staleTime: 60_000,
      })),
    ],
  })

  const [total, active, submitted, rework] = results

  const counts: CustomerLifecycleCounts = {
    total: total.data?.totalElements ?? 0,
    active: active.data?.totalElements ?? 0,
    submitted: submitted.data?.totalElements ?? 0,
    rework: rework.data?.totalElements ?? 0,
  }

  return {
    counts,
    isLoading: results.some((r) => r.isLoading),
  }
}
