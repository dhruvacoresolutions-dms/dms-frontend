"use client"

import { useQuery } from "@tanstack/react-query"
import { getEmployeeImportJob } from "../api/employee.api"
import { employeeKeys } from "../api/employee-keys"

export function useEmployeeImportJob(
  companyUuid: string,
  importJobUuid: string,
  options?: { enabled?: boolean; refetchInterval?: number | false }
) {
  return useQuery({
    queryKey: employeeKeys.importDetail(companyUuid, importJobUuid),
    queryFn: () => getEmployeeImportJob(companyUuid, importJobUuid),
    enabled: !!companyUuid && !!importJobUuid && (options?.enabled ?? true),
    refetchInterval: options?.refetchInterval,
  })
}
