"use client"

import { useQuery } from "@tanstack/react-query"
import { getEmployees } from "../api/employee.api"
import { employeeKeys } from "../api/employee-keys"
import type { EmployeeListParams } from "../api/employee.types"

export function useEmployees(companyUuid: string, params?: EmployeeListParams) {
  return useQuery({
    queryKey: employeeKeys.list(companyUuid, params),
    queryFn: () => getEmployees(companyUuid, params),
    enabled: !!companyUuid,
  })
}
