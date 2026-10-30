"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { reviewCustomerEntry } from "../api/customer.api"
import { customerKeys } from "../api/customer-keys"
import type {
  CustomerBankEntry,
  CustomerEntryAction,
  CustomerEntryKind,
  CustomerKycEntry,
} from "../api/customer.types"

/**
 * `verify` / `reject` / `revoke` an entry. Requires `CUSTOMER_APPROVE` and a
 * reviewer who is not the creator; `reject`/`revoke` need a reason.
 */
export function useReviewCustomerEntry(companyUuid: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      customerUuid,
      kind,
      entryUuid,
      action,
      reason,
    }: {
      customerUuid: string
      kind: CustomerEntryKind
      entryUuid: string
      action: CustomerEntryAction
      reason?: string
    }) =>
      reviewCustomerEntry(companyUuid, customerUuid, kind, entryUuid, action, reason) as Promise<
        CustomerKycEntry | CustomerBankEntry
      >,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey:
          variables.kind === "kyc-entries"
            ? customerKeys.kyc(companyUuid, variables.customerUuid)
            : customerKeys.bankEntries(companyUuid, variables.customerUuid),
      })
      queryClient.invalidateQueries({
        queryKey: customerKeys.detail(companyUuid, variables.customerUuid),
      })
      queryClient.invalidateQueries({ queryKey: customerKeys.lists(companyUuid) })
    },
  })
}
