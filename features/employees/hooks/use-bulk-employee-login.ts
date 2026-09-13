"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  bulkDisableEmployeeLogin,
  bulkEnableEmployeeLogin,
} from "../api/employee.api"
import { employeeKeys } from "../api/employee-keys"
import type {
  BulkDisableEmployeeLoginRequest,
  BulkEnableEmployeeLoginRequest,
} from "../api/employee.types"

export function useBulkEnableEmployeeLogin(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BulkEnableEmployeeLoginRequest) =>
      bulkEnableEmployeeLogin(companyUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: employeeKeys.lists(companyUuid),
      })
    },
  })
}

export function useBulkDisableEmployeeLogin(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BulkDisableEmployeeLoginRequest) =>
      bulkDisableEmployeeLogin(companyUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: employeeKeys.lists(companyUuid),
      })
    },
  })
}
