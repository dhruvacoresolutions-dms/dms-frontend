"use client"

import { useQuery } from "@tanstack/react-query"
import { getEmployeeImportRows } from "../api/employee.api"
import { employeeKeys } from "../api/employee-keys"

export function useEmployeeImportRows(
  companyUuid: string,
  importJobUuid: string,
  params?: { page?: number; size?: number }
) {
  return useQuery({
    queryKey: [...employeeKeys.importRows(companyUuid, importJobUuid), params] as const,
    queryFn: () => getEmployeeImportRows(companyUuid, importJobUuid, params),
    enabled: !!companyUuid && !!importJobUuid,
  })
}
