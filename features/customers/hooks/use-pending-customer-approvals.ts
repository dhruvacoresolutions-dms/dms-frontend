"use client"

import { useQuery } from "@tanstack/react-query"
import { getPendingCustomerApprovals } from "../api/customer.api"
import { customerKeys } from "../api/customer-keys"
import type { CustomerApprovalQueueParams } from "../api/customer.types"

/**
 * SUBMITTED customers waiting for the current approver
 * (`GET …/customers?pendingMyApproval=true`).
 */
export function usePendingCustomerApprovals(
  companyUuid: string,
  params?: CustomerApprovalQueueParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: customerKeys.pendingApproval(companyUuid, params),
    queryFn: () => getPendingCustomerApprovals(companyUuid, params),
    enabled: !!companyUuid && (options?.enabled ?? true),
  })
}
