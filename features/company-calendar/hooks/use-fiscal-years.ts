"use client"

import { useQuery } from "@tanstack/react-query"
import { getFiscalYears } from "../api/company-calendar.api"
import { companyCalendarKeys } from "../api/company-calendar-keys"

export function useFiscalYears(companyUuid: string) {
  return useQuery({
    queryKey: companyCalendarKeys.fiscalYears(companyUuid),
    queryFn: getFiscalYears,
    enabled: !!companyUuid,
  })
}
