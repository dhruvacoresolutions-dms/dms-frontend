"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateDistributorReference } from "../api/distributor-reference.api"
import { distributorReferenceKeys } from "../api/distributor-keys"
import type {
  DistributorReferenceKind,
  UpdateDistributorReferenceRequest,
} from "../api/distributor-reference.types"

export function useUpdateDistributorReference(
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
      input: UpdateDistributorReferenceRequest
    }) => updateDistributorReference(companyUuid, kind, uuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: distributorReferenceKeys.lists(companyUuid, kind),
      })
      queryClient.invalidateQueries({
        queryKey: distributorReferenceKeys.detail(companyUuid, kind, variables.uuid),
      })
    },
  })
}
