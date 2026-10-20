"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { closeAccountingPeriod } from "../api/company-calendar.api"
import { companyCalendarKeys } from "../api/company-calendar-keys"

export function useCloseAccountingPeriod(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      periodUuid,
    }: {
      fiscalYearUuid: string
      periodUuid: string
    }) => closeAccountingPeriod(periodUuid),
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
