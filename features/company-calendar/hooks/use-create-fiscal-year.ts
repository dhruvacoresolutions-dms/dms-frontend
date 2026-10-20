"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createFiscalYear } from "../api/company-calendar.api"
import { companyCalendarKeys } from "../api/company-calendar-keys"
import type { YearRequest } from "../api/company-calendar.types"

export function useCreateFiscalYear(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: YearRequest) => createFiscalYear(input),
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
