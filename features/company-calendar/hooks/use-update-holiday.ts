"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateHoliday } from "../api/company-calendar.api"
import { companyCalendarKeys } from "../api/company-calendar-keys"
import type { HolidayRequest } from "../api/company-calendar.types"

export function useUpdateHoliday(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      holidayUuid,
      input,
    }: {
      holidayUuid: string
      input: HolidayRequest
    }) => updateHoliday(holidayUuid, input),
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
