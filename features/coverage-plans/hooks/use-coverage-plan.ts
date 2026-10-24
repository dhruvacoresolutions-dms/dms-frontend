"use client"

import { useQuery } from "@tanstack/react-query"
import { getCoveragePlan } from "../api/coverage-plan.api"
import { coveragePlanKeys } from "../api/coverage-plan-keys"

export function useCoveragePlan(companyUuid: string, planUuid: string) {
  return useQuery({
    queryKey: coveragePlanKeys.detail(companyUuid, planUuid),
    queryFn: () => getCoveragePlan(planUuid),
    enabled: !!companyUuid && !!planUuid,
  })
}
