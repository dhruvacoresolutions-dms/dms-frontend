"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getPermissionSetAssignments,
  assignPermissionSet,
  removePermissionSetAssignment,
} from "../api/user.api"
import { userKeys } from "../api/user-keys"
import type { PermissionSetAssignmentRequest } from "../api/user.types"

export function usePermissionSetAssignments(
  companyUuid: string,
  userUuid: string
) {
  return useQuery({
    queryKey: userKeys.permissionSetAssignments(companyUuid, userUuid),
    queryFn: () => getPermissionSetAssignments(companyUuid, userUuid),
    enabled: !!companyUuid && !!userUuid,
  })
}

export function useAssignPermissionSet(
  companyUuid: string,
  userUuid: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: PermissionSetAssignmentRequest) =>
      assignPermissionSet(companyUuid, userUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: userKeys.permissionSetAssignments(companyUuid, userUuid),
      })
      queryClient.invalidateQueries({
        queryKey: userKeys.effectiveAccess(companyUuid, userUuid),
      })
    },
  })
}

export function useRemovePermissionSetAssignment(
  companyUuid: string,
  userUuid: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (assignmentUuid: string) =>
      removePermissionSetAssignment(companyUuid, userUuid, assignmentUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: userKeys.permissionSetAssignments(companyUuid, userUuid),
      })
      queryClient.invalidateQueries({
        queryKey: userKeys.effectiveAccess(companyUuid, userUuid),
      })
    },
  })
}
