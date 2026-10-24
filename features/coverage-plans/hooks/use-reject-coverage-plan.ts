"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { rejectCoveragePlan } from "../api/coverage-plan.api"
import { coveragePlanKeys } from "../api/coverage-plan-keys"
import type { CoverageRejectRequest } from "../api/coverage-plan.types"

export function useRejectCoveragePlan(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      planUuid,
      input,
    }: {
      planUuid: string
      input: CoverageRejectRequest
    }) => rejectCoveragePlan(planUuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: coveragePlanKeys.lists(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: coveragePlanKeys.detail(companyUuid, variables.planUuid),
      })
    },
  })
}
