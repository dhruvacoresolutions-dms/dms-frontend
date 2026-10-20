"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateAccountingPeriod } from "../api/company-calendar.api"
import { companyCalendarKeys } from "../api/company-calendar-keys"
import type { PeriodRequest } from "../api/company-calendar.types"

export function useUpdateAccountingPeriod(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      periodUuid,
      input,
    }: {
      fiscalYearUuid: string
      periodUuid: string
      input: PeriodRequest
    }) => updateAccountingPeriod(periodUuid, input),
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
