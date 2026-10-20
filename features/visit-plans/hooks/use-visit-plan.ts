"use client"

import { useQuery } from "@tanstack/react-query"
import { getVisitPlan } from "../api/visit-plan.api"
import { visitPlanKeys } from "../api/visit-plan-keys"

export function useVisitPlan(companyUuid: string, planUuid: string) {
  return useQuery({
    queryKey: visitPlanKeys.detail(companyUuid, planUuid),
    queryFn: () => getVisitPlan(planUuid),
    enabled: !!companyUuid && !!planUuid,
  })
}
