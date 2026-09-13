"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createDepartment } from "../api/department.api"
import { departmentKeys } from "../api/department-keys"
import type { CreateDepartmentRequest } from "../api/department.types"

export function useCreateDepartment(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateDepartmentRequest) =>
      createDepartment(companyUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: departmentKeys.lists(companyUuid),
      })
    },
  })
}
