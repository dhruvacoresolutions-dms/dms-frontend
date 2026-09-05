"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { uploadEmployeeImport } from "../api/employee.api"
import { employeeKeys } from "../api/employee-keys"

export function useUploadEmployeeImport(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => uploadEmployeeImport(companyUuid, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists(companyUuid) })
      queryClient.invalidateQueries({ queryKey: employeeKeys.imports(companyUuid) })
    },
  })
}
