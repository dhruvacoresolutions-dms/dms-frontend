"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateEmployee } from "../api/employee.api"
import { employeeKeys } from "../api/employee-keys"
import type { UpdateEmployeeRequest } from "../api/employee.types"

export function useUpdateEmployee(companyUuid: string, employeeUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateEmployeeRequest) =>
      updateEmployee(companyUuid, employeeUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: employeeKeys.lists(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: employeeKeys.detail(companyUuid, employeeUuid),
      })
    },
  })
}
