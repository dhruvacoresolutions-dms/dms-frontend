"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { disableEmployeeLogin } from "../api/employee.api"
import { employeeKeys } from "../api/employee-keys"
import { patchEmployeeInLists } from "../utils/employee-cache"

export function useDisableEmployeeLogin(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (employeeUuid: string) =>
      disableEmployeeLogin(companyUuid, employeeUuid),
    onSuccess: (_data, employeeUuid) => {
      patchEmployeeInLists(queryClient, companyUuid, employeeUuid, {
        loginEnabled: false,
        loginStatus: "INACTIVE",
      })
      queryClient.invalidateQueries({
        queryKey: employeeKeys.lists(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: employeeKeys.detail(companyUuid, employeeUuid),
      })
    },
  })
}
