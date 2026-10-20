"use client"

import { useQuery } from "@tanstack/react-query"
import { getWeeklyOffRule } from "../api/company-calendar.api"
import { companyCalendarKeys } from "../api/company-calendar-keys"

export function useWeeklyOffRule(companyUuid: string) {
  return useQuery({
    queryKey: companyCalendarKeys.weeklyOffRule(companyUuid),
    queryFn: getWeeklyOffRule,
    enabled: !!companyUuid,
  })
}
