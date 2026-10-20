"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { withdrawVisitPlan } from "../api/visit-plan.api"
import { visitPlanKeys } from "../api/visit-plan-keys"

export function useWithdrawVisitPlan(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (planUuid: string) => withdrawVisitPlan(planUuid),
    onSuccess: (_data, planUuid) => {
      queryClient.invalidateQueries({
        queryKey: visitPlanKeys.lists(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: visitPlanKeys.detail(companyUuid, planUuid),
      })
      queryClient.invalidateQueries({
        queryKey: visitPlanKeys.unplanned(companyUuid),
      })
    },
  })
}
