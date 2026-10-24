"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateCoveragePlan } from "../api/coverage-plan.api"
import { coveragePlanKeys } from "../api/coverage-plan-keys"
import type { CoveragePlanRequest } from "../api/coverage-plan.types"
import { visitPlanKeys } from "@/features/visit-plans/api/visit-plan-keys"

export function useUpdateCoveragePlan(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      planUuid,
      input,
    }: {
      planUuid: string
      input: CoveragePlanRequest
    }) => updateCoveragePlan(planUuid, input),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: coveragePlanKeys.lists(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: coveragePlanKeys.detail(companyUuid, variables.planUuid),
      })
      // Editing an APPROVED plan regenerates its generated visit plans.
      if (data.status === "APPROVED") {
        queryClient.invalidateQueries({
          queryKey: visitPlanKeys.lists(companyUuid),
        })
      }
    },
  })
}
