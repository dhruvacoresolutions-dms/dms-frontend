"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createHoliday } from "../api/company-calendar.api"
import { companyCalendarKeys } from "../api/company-calendar-keys"
import type { HolidayRequest } from "../api/company-calendar.types"

export function useCreateHoliday(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: HolidayRequest) => createHoliday(input),
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
