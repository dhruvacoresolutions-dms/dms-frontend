"use client"

import { useQuery } from "@tanstack/react-query"
import { getUnplannedCustomers } from "../api/visit-plan.api"
import { visitPlanKeys } from "../api/visit-plan-keys"
import type { UnplannedCustomersParams } from "../api/visit-plan.types"

/**
 * Candidates for the plan builder. Requires a date, and a destination
 * geography when `planType` is OUTSTATION. Pass `excludePlanUuid` while editing
 * so the plan's own customers reappear as candidates.
 */
export function useUnplannedCustomers(
  companyUuid: string,
  params: UnplannedCustomersParams,
  options?: { enabled?: boolean }
) {
  const canQuery =
    !!companyUuid &&
    !!params.date &&
    (params.planType !== "OUTSTATION" || !!params.destinationGeographyUuid)

  return useQuery({
    queryKey: visitPlanKeys.unplannedList(
      companyUuid,
      params as unknown as Record<string, unknown>
    ),
    queryFn: () => getUnplannedCustomers(params),
    enabled: canQuery && (options?.enabled ?? true),
  })
}
