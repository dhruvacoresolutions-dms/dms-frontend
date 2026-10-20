"use client"

import { useQuery } from "@tanstack/react-query"
import { getAccountingPeriods } from "../api/company-calendar.api"
import { companyCalendarKeys } from "../api/company-calendar-keys"

export function useAccountingPeriods(
  companyUuid: string,
  fiscalYearUuid: string
) {
  return useQuery({
    queryKey: companyCalendarKeys.periods(companyUuid, fiscalYearUuid),
    queryFn: () => getAccountingPeriods(fiscalYearUuid),
    enabled: !!companyUuid && !!fiscalYearUuid,
  })
}
