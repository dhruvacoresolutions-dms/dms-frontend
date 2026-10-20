"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateClaimPolicy } from "../api/company-calendar.api"
import { companyCalendarKeys } from "../api/company-calendar-keys"
import type { ClaimPolicyRequest } from "../api/company-calendar.types"

export function useUpdateClaimPolicy(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ClaimPolicyRequest) => updateClaimPolicy(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: companyCalendarKeys.settings(companyUuid),
      })
    },
  })
}
