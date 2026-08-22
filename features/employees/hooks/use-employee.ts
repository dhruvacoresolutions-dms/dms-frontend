"use client"

import { useQuery } from "@tanstack/react-query"
import { getEmployee } from "../api/employee.api"
import { employeeKeys } from "../api/employee-keys"

export function useEmployee(companyUuid: string, employeeUuid: string) {
  return useQuery({
    queryKey: employeeKeys.detail(companyUuid, employeeUuid),
    queryFn: () => getEmployee(companyUuid, employeeUuid),
    enabled: !!companyUuid && !!employeeUuid,
  })
}
