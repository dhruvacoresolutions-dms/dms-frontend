"use client"

import { useQuery } from "@tanstack/react-query"
import { getHolidays } from "../api/company-calendar.api"
import { companyCalendarKeys } from "../api/company-calendar-keys"
import type { HolidayListParams } from "../api/company-calendar.types"

export function useHolidays(
  companyUuid: string,
  params?: HolidayListParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: companyCalendarKeys.holidayList(companyUuid, params),
    queryFn: () => getHolidays(params),
    enabled: !!companyUuid && (options?.enabled ?? true),
  })
}
