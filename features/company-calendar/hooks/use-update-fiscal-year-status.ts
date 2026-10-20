"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateFiscalYearStatus } from "../api/company-calendar.api"
import { companyCalendarKeys } from "../api/company-calendar-keys"
import type { CalendarStatus } from "../api/company-calendar.types"

export function useUpdateFiscalYearStatus(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      fiscalYearUuid,
      status,
    }: {
      fiscalYearUuid: string
      status: CalendarStatus
    }) => updateFiscalYearStatus(fiscalYearUuid, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: companyCalendarKeys.fiscalYears(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: companyCalendarKeys.effective(companyUuid),
      })
    },
  })
}
