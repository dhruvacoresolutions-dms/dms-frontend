"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createDistributorReference } from "../api/distributor-reference.api"
import { distributorReferenceKeys } from "../api/distributor-keys"
import type {
  DistributorReferenceKind,
  CreateDistributorReferenceRequest,
} from "../api/distributor-reference.types"

export function useCreateDistributorReference(
  companyUuid: string,
  kind: DistributorReferenceKind
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateDistributorReferenceRequest) =>
      createDistributorReference(companyUuid, kind, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: distributorReferenceKeys.lists(companyUuid, kind),
      })
    },
  })
}
