"use client"

import { useQuery } from "@tanstack/react-query"
import { getCoveragePlans } from "../api/coverage-plan.api"
import { coveragePlanKeys } from "../api/coverage-plan-keys"
import type { CoveragePlanListParams } from "../api/coverage-plan.types"

export function useCoveragePlans(
  companyUuid: string,
  params?: CoveragePlanListParams
) {
  return useQuery({
    queryKey: coveragePlanKeys.list(
      companyUuid,
      params as Record<string, unknown> | undefined
    ),
    queryFn: () => getCoveragePlans(params),
    enabled: !!companyUuid,
  })
}
