"use client"

import { useQuery } from "@tanstack/react-query"
import { getEffectiveCalendar } from "../api/company-calendar.api"
import { companyCalendarKeys } from "../api/company-calendar-keys"
import type { EffectiveCalendarParams } from "../api/company-calendar.types"

export function useEffectiveCalendar(
  companyUuid: string,
  params: EffectiveCalendarParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: companyCalendarKeys.effectiveList(companyUuid, params),
    queryFn: () => getEffectiveCalendar(params),
    enabled: !!companyUuid && (options?.enabled ?? true),
  })
}
