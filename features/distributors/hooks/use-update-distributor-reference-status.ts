"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateDistributorReferenceStatus } from "../api/distributor-reference.api"
import { distributorReferenceKeys } from "../api/distributor-keys"
import type {
  DistributorReferenceKind,
  UpdateDistributorReferenceStatusRequest,
} from "../api/distributor-reference.types"

export function useUpdateDistributorReferenceStatus(
  companyUuid: string,
  kind: DistributorReferenceKind
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      uuid,
      input,
    }: {
      uuid: string
      input: UpdateDistributorReferenceStatusRequest
    }) => updateDistributorReferenceStatus(companyUuid, kind, uuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: distributorReferenceKeys.lists(companyUuid, kind),
      })
    },
  })
}
