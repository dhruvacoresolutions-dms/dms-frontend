"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createVisitPlan } from "../api/visit-plan.api"
import { visitPlanKeys } from "../api/visit-plan-keys"
import type { VisitPlanRequest } from "../api/visit-plan.types"

export function useCreateVisitPlan(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: VisitPlanRequest) => createVisitPlan(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: visitPlanKeys.lists(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: visitPlanKeys.unplanned(companyUuid),
      })
    },
  })
}
