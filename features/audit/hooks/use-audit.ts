"use client"

import { useQuery } from "@tanstack/react-query"
import { getAuditEvents } from "../api/audit.api"
import { auditKeys } from "../api/audit-keys"
import type { AuditListParams } from "../api/audit.types"

export function useAuditEvents(companyUuid: string, params?: AuditListParams) {
  return useQuery({
    queryKey: auditKeys.list(companyUuid, params),
    queryFn: () => getAuditEvents(companyUuid, params),
    enabled: !!companyUuid,
  })
}
