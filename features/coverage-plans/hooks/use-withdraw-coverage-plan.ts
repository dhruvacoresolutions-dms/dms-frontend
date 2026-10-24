"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { withdrawCoveragePlan } from "../api/coverage-plan.api"
import { coveragePlanKeys } from "../api/coverage-plan-keys"

export function useWithdrawCoveragePlan(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (planUuid: string) => withdrawCoveragePlan(planUuid),
    onSuccess: (_data, planUuid) => {
      queryClient.invalidateQueries({
        queryKey: coveragePlanKeys.lists(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: coveragePlanKeys.detail(companyUuid, planUuid),
      })
    },
  })
}
