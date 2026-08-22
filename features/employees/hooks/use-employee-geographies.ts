"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getEmployeeGeographies,
  assignEmployeeGeography,
  removeEmployeeGeography,
} from "../api/employee.api"
import { employeeKeys } from "../api/employee-keys"
import type { AssignEmployeeGeographyRequest } from "../api/employee.types"

export function useEmployeeGeographies(
  companyUuid: string,
  employeeUuid: string
) {
  return useQuery({
    queryKey: employeeKeys.geographies(companyUuid, employeeUuid),
    queryFn: () => getEmployeeGeographies(companyUuid, employeeUuid),
    enabled: !!companyUuid && !!employeeUuid,
  })
}

export function useAssignEmployeeGeography(
  companyUuid: string,
  employeeUuid: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: AssignEmployeeGeographyRequest) =>
      assignEmployeeGeography(companyUuid, employeeUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: employeeKeys.geographies(companyUuid, employeeUuid),
      })
    },
  })
}

export function useRemoveEmployeeGeography(
  companyUuid: string,
  employeeUuid: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (geographyUuid: string) =>
      removeEmployeeGeography(companyUuid, employeeUuid, geographyUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: employeeKeys.geographies(companyUuid, employeeUuid),
      })
    },
  })
}
