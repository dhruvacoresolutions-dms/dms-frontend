import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import type { AuditEventResponse, AuditListParams } from "./audit.types"
import type { PageResponse } from "@/features/companies/api/company.types"

export async function getAuditEvents(
  companyUuid: string,
  params?: AuditListParams
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<AuditEventResponse>>
  >(`/v1/companies/${companyUuid}/rbac-audit-events`, {
    params,
    headers: { "X-Company-Context": companyUuid },
  })
  return data.data
}
