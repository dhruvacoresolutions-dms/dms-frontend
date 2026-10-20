"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateVisitRadius } from "../api/company-calendar.api"
import { companyCalendarKeys } from "../api/company-calendar-keys"
import type { RadiusRequest } from "../api/company-calendar.types"

export function useUpdateVisitRadius(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RadiusRequest) => updateVisitRadius(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: companyCalendarKeys.settings(companyUuid),
      })
    },
  })
}
