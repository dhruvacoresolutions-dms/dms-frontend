"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { rejectVisitPlan } from "../api/visit-plan.api"
import { visitPlanKeys } from "../api/visit-plan-keys"
import type { RejectVisitPlanRequest } from "../api/visit-plan.types"

export function useRejectVisitPlan(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      planUuid,
      input,
    }: {
      planUuid: string
      input: RejectVisitPlanRequest
    }) => rejectVisitPlan(planUuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: visitPlanKeys.lists(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: visitPlanKeys.detail(companyUuid, variables.planUuid),
      })
      queryClient.invalidateQueries({
        queryKey: visitPlanKeys.unplanned(companyUuid),
      })
    },
  })
}
