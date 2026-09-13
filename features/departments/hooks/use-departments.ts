"use client"

import { useQuery } from "@tanstack/react-query"
import { getDepartments } from "../api/department.api"
import { departmentKeys } from "../api/department-keys"
import type { DepartmentListParams } from "../api/department.types"

export function useDepartments(
  companyUuid: string,
  params?: DepartmentListParams
) {
  return useQuery({
    queryKey: departmentKeys.list(companyUuid, params),
    queryFn: () => getDepartments(companyUuid, params),
    enabled: !!companyUuid,
  })
}
