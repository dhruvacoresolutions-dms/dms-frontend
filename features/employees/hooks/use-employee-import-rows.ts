"use client"

import { useQuery } from "@tanstack/react-query"
import { getEmployeeImportRows } from "../api/employee.api"
import { employeeKeys } from "../api/employee-keys"
import type { EmployeeImportRowListParams } from "../api/employee.types"

export function useEmployeeImportRows(
  companyUuid: string,
  importJobUuid: string,
  params?: EmployeeImportRowListParams
) {
  return useQuery({
    queryKey: employeeKeys.importRows(companyUuid, importJobUuid, params),
    queryFn: () => getEmployeeImportRows(companyUuid, importJobUuid, params),
    enabled: !!companyUuid && !!importJobUuid,
  })
}
