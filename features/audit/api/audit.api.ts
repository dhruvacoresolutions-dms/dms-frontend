import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import type { AuditEventResponse, AuditListParams } from "./audit.types"
import type { PageResponse } from "@/features/companies/api/company.types"

function resolveCompanyUuid(companyUuid: string): string {
  if (companyUuid !== "current") return companyUuid
  return useAuthStore.getState().session?.user?.companyUuid ?? companyUuid
}

export async function getAuditEvents(
  companyUuid: string,
  params?: AuditListParams
) {
  const resolved = resolveCompanyUuid(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<AuditEventResponse>>
  >(`/v1/companies/${resolved}/rbac-audit-events`, {
    params,
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}
