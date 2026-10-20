"use client"

import { useQuery } from "@tanstack/react-query"
import { getCalendarSettings } from "../api/company-calendar.api"
import { companyCalendarKeys } from "../api/company-calendar-keys"

export function useCalendarSettings(companyUuid: string) {
  return useQuery({
    queryKey: companyCalendarKeys.settings(companyUuid),
    queryFn: getCalendarSettings,
    enabled: !!companyUuid,
  })
}
