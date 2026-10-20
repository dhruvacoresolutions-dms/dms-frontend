"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateFiscalYear } from "../api/company-calendar.api"
import { companyCalendarKeys } from "../api/company-calendar-keys"
import type { YearRequest } from "../api/company-calendar.types"

export function useUpdateFiscalYear(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      fiscalYearUuid,
      input,
    }: {
      fiscalYearUuid: string
      input: YearRequest
    }) => updateFiscalYear(fiscalYearUuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: companyCalendarKeys.fiscalYears(companyUuid),
      })
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
