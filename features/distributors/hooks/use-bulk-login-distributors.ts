"use client"
import { useMutation } from "@tanstack/react-query"
import { bulkLoginDistributors } from "../api/distributor.api"
import type { BulkDistributorRequest } from "../api/distributor.types"
export function useBulkLoginDistributors(companyUuid: string) {
  return useMutation({
    mutationFn: (input: BulkDistributorRequest) =>
      bulkLoginDistributors(companyUuid, input),
  })
}
