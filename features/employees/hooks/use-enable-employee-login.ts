"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { enableEmployeeLogin } from "../api/employee.api"
import { employeeKeys } from "../api/employee-keys"
import { patchEmployeeInLists } from "../utils/employee-cache"
import type { EnableEmployeeLoginRequest } from "../api/employee.types"

export function useEnableEmployeeLogin(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeUuid,
      input,
    }: {
      employeeUuid: string
      input: EnableEmployeeLoginRequest
    }) => enableEmployeeLogin(companyUuid, employeeUuid, input),
    onSuccess: (_data, variables) => {
      patchEmployeeInLists(queryClient, companyUuid, variables.employeeUuid, {
        loginEnabled: true,
        loginStatus: "ACTIVE",
      })
      queryClient.invalidateQueries({
        queryKey: employeeKeys.lists(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: employeeKeys.detail(companyUuid, variables.employeeUuid),
      })
    },
  })
}
