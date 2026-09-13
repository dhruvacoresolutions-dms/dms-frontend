"use client"

import { useQuery } from "@tanstack/react-query"
import { getDepartment } from "../api/department.api"
import { departmentKeys } from "../api/department-keys"

export function useDepartment(companyUuid: string, departmentUuid: string) {
  return useQuery({
    queryKey: departmentKeys.detail(companyUuid, departmentUuid),
    queryFn: () => getDepartment(companyUuid, departmentUuid),
    enabled: !!companyUuid && !!departmentUuid,
  })
}
