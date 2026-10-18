import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import type { PageResponse } from "@/features/companies/api/company.types"
import type {
  DistributorReferenceKind,
  DistributorReferenceResponse,
  CreateDistributorReferenceRequest,
  UpdateDistributorReferenceRequest,
  UpdateDistributorReferenceStatusRequest,
  DistributorReferenceListParams,
} from "./distributor-reference.types"

function resolveCompanyUuid(companyUuid: string): string {
  if (companyUuid !== "current") return companyUuid
  return useAuthStore.getState().session?.user?.companyUuid ?? companyUuid
}

const baseUrl = (companyUuid: string, kind: DistributorReferenceKind) =>
  `/api/v1/companies/${resolveCompanyUuid(companyUuid)}/${kind}`

function companyHeader(companyUuid: string): string {
  return resolveCompanyUuid(companyUuid)
}

export async function getDistributorReferences(
  companyUuid: string,
  kind: DistributorReferenceKind,
  params?: DistributorReferenceListParams
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<DistributorReferenceResponse>>
  >(baseUrl(companyUuid, kind), {
    params,
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function getDistributorReference(
  companyUuid: string,
  kind: DistributorReferenceKind,
  uuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<DistributorReferenceResponse>
  >(`${baseUrl(companyUuid, kind)}/${uuid}`, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function createDistributorReference(
  companyUuid: string,
  kind: DistributorReferenceKind,
  input: CreateDistributorReferenceRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<
    ApiSuccessResponse<DistributorReferenceResponse>
  >(baseUrl(companyUuid, kind), input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function updateDistributorReference(
  companyUuid: string,
  kind: DistributorReferenceKind,
  uuid: string,
  input: UpdateDistributorReferenceRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.put<
    ApiSuccessResponse<DistributorReferenceResponse>
  >(`${baseUrl(companyUuid, kind)}/${uuid}`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function updateDistributorReferenceStatus(
  companyUuid: string,
  kind: DistributorReferenceKind,
  uuid: string,
  input: UpdateDistributorReferenceStatusRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.patch<
    ApiSuccessResponse<DistributorReferenceResponse>
  >(`${baseUrl(companyUuid, kind)}/${uuid}/status`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}
