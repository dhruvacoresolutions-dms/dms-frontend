"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createAccountingPeriod } from "../api/company-calendar.api"
import { companyCalendarKeys } from "../api/company-calendar-keys"
import type { PeriodRequest } from "../api/company-calendar.types"

export function useCreateAccountingPeriod(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      fiscalYearUuid,
      input,
    }: {
      fiscalYearUuid: string
      input: PeriodRequest
    }) => createAccountingPeriod(fiscalYearUuid, input),
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
