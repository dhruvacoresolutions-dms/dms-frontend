"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createCoveragePlan } from "../api/coverage-plan.api"
import { coveragePlanKeys } from "../api/coverage-plan-keys"
import type {
  CoveragePlan,
  CoveragePlanRequest,
} from "../api/coverage-plan.types"
import { visitPlanKeys } from "@/features/visit-plans/api/visit-plan-keys"

export function useCreateCoveragePlan(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CoveragePlanRequest) => createCoveragePlan(input),
    onSuccess: (data: CoveragePlan) => {
      queryClient.invalidateQueries({
        queryKey: coveragePlanKeys.lists(companyUuid),
      })
      if (data.status === "APPROVED") {
        queryClient.invalidateQueries({
          queryKey: visitPlanKeys.lists(companyUuid),
        })
      }
    },
  })
}
