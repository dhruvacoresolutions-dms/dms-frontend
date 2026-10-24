"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { cancelCoveragePlan } from "../api/coverage-plan.api"
import { coveragePlanKeys } from "../api/coverage-plan-keys"
import { visitPlanKeys } from "@/features/visit-plans/api/visit-plan-keys"

export function useCancelCoveragePlan(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (planUuid: string) => cancelCoveragePlan(planUuid),
    onSuccess: (_data, planUuid) => {
      queryClient.invalidateQueries({
        queryKey: coveragePlanKeys.lists(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: coveragePlanKeys.detail(companyUuid, planUuid),
      })
      queryClient.invalidateQueries({
        queryKey: visitPlanKeys.lists(companyUuid),
      })
    },
  })
}
