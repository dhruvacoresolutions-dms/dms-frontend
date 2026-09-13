"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateDepartment } from "../api/department.api"
import { departmentKeys } from "../api/department-keys"
import type { UpdateDepartmentRequest } from "../api/department.types"

export function useUpdateDepartment(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      uuid,
      input,
    }: {
      uuid: string
      input: UpdateDepartmentRequest
    }) => updateDepartment(companyUuid, uuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: departmentKeys.lists(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: departmentKeys.detail(companyUuid, variables.uuid),
      })
    },
  })
}
