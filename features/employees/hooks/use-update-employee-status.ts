"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateEmployeeStatus } from "../api/employee.api"
import { employeeKeys } from "../api/employee-keys"
import type { UpdateEmployeeStatusRequest } from "../api/employee.types"

export function useUpdateEmployeeStatus(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeUuid,
      input,
    }: {
      employeeUuid: string
      input: UpdateEmployeeStatusRequest
    }) => updateEmployeeStatus(companyUuid, employeeUuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: employeeKeys.lists(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: employeeKeys.detail(companyUuid, variables.employeeUuid),
      })
    },
  })
}
