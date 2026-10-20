"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateWeeklyOffRule } from "../api/company-calendar.api"
import { companyCalendarKeys } from "../api/company-calendar-keys"
import type { WeeklyOffRuleRequest } from "../api/company-calendar.types"

export function useUpdateWeeklyOffRule(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: WeeklyOffRuleRequest) => updateWeeklyOffRule(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: companyCalendarKeys.weeklyOffRule(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: companyCalendarKeys.effective(companyUuid),
      })
    },
  })
}
