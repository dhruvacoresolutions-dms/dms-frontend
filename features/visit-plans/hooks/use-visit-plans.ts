"use client"

import { useQuery } from "@tanstack/react-query"
import { getVisitPlans } from "../api/visit-plan.api"
import { visitPlanKeys } from "../api/visit-plan-keys"
import type { VisitPlanListParams } from "../api/visit-plan.types"

export function useVisitPlans(
  companyUuid: string,
  params?: VisitPlanListParams
) {
  return useQuery({
    queryKey: visitPlanKeys.list(
      companyUuid,
      params as Record<string, unknown> | undefined
    ),
    queryFn: () => getVisitPlans(params),
    enabled: !!companyUuid,
  })
}
