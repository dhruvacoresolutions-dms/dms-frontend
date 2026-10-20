"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { reopenAccountingPeriod } from "../api/company-calendar.api"
import { companyCalendarKeys } from "../api/company-calendar-keys"

export function useReopenAccountingPeriod(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      periodUuid,
      reason,
    }: {
      fiscalYearUuid: string
      periodUuid: string
      reason: string
    }) => reopenAccountingPeriod(periodUuid, { reason }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: companyCalendarKeys.periods(
          companyUuid,
          variables.fiscalYearUuid
        ),
      })
      queryClient.invalidateQueries({
        queryKey: companyCalendarKeys.effective(companyUuid),
      })
    },
  })
}
