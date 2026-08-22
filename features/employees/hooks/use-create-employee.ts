"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createEmployee } from "../api/employee.api"
import { employeeKeys } from "../api/employee-keys"
import type { CreateEmployeeRequest } from "../api/employee.types"

export function useCreateEmployee(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateEmployeeRequest) =>
      createEmployee(companyUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: employeeKeys.lists(companyUuid),
      })
    },
  })
}
