"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getRoleAssignments,
  assignRole,
  removeRoleAssignment,
} from "../api/user.api"
import { userKeys } from "../api/user-keys"
import type { CreateRoleAssignmentRequest } from "../api/user.types"

export function useRoleAssignments(companyUuid: string, userUuid: string) {
  return useQuery({
    queryKey: userKeys.roleAssignments(companyUuid, userUuid),
    queryFn: () => getRoleAssignments(companyUuid, userUuid),
    enabled: !!companyUuid && !!userUuid,
  })
}

export function useAssignRole(companyUuid: string, userUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateRoleAssignmentRequest) =>
      assignRole(companyUuid, userUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: userKeys.roleAssignments(companyUuid, userUuid),
      })
      queryClient.invalidateQueries({
        queryKey: userKeys.effectiveAccess(companyUuid, userUuid),
      })
    },
  })
}

export function useRemoveRoleAssignment(
  companyUuid: string,
  userUuid: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (assignmentUuid: string) =>
      removeRoleAssignment(companyUuid, userUuid, assignmentUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: userKeys.roleAssignments(companyUuid, userUuid),
      })
      queryClient.invalidateQueries({
        queryKey: userKeys.effectiveAccess(companyUuid, userUuid),
      })
    },
  })
}
