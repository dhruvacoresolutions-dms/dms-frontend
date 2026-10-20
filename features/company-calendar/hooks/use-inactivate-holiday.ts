"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { inactivateHoliday } from "../api/company-calendar.api"
import { companyCalendarKeys } from "../api/company-calendar-keys"

export function useInactivateHoliday(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (holidayUuid: string) => inactivateHoliday(holidayUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: companyCalendarKeys.holidays(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: companyCalendarKeys.effective(companyUuid),
      })
    },
  })
}
