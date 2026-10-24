"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { resubmitCoveragePlan } from "../api/coverage-plan.api"
import { coveragePlanKeys } from "../api/coverage-plan-keys"
import type { CoveragePlanRequest } from "../api/coverage-plan.types"

export function useResubmitCoveragePlan(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      planUuid,
      input,
    }: {
      planUuid: string
      input?: CoveragePlanRequest
    }) => resubmitCoveragePlan(planUuid, input),
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
