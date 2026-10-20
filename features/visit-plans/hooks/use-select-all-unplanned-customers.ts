"use client"

import { useQuery } from "@tanstack/react-query"
import { selectAllUnplannedCustomers } from "../api/visit-plan.api"
import { visitPlanKeys } from "../api/visit-plan-keys"
import type { SelectAllUnplannedCustomersParams } from "../api/visit-plan.types"

/** Server-side "select all" (capped at 200 ids by the backend). */
export function useSelectAllUnplannedCustomers(
  companyUuid: string,
  params: SelectAllUnplannedCustomersParams,
  options?: { enabled?: boolean }
) {
  const canQuery =
    !!companyUuid &&
    !!params.date &&
    (params.planType !== "OUTSTATION" || !!params.destinationGeographyUuid)

  return useQuery({
    queryKey: visitPlanKeys.unplannedSelectAll(
      companyUuid,
      params as unknown as Record<string, unknown>
    ),
    queryFn: () => selectAllUnplannedCustomers(params),
    enabled: canQuery && (options?.enabled ?? false),
  })
}
