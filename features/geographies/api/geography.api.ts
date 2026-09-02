import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import type {
  GeographyResponse,
  CreateGeographyRequest,
  UpdateGeographyRequest,
  UpdateGeographyStatusRequest,
  GeographyListParams,
} from "./geography.types"
import type { PageResponse } from "@/features/companies/api/company.types"

function resolveCompanyUuid(companyUuid: string): string {
  if (companyUuid !== "current") return companyUuid
  return useAuthStore.getState().session?.user?.companyUuid ?? companyUuid
}

const baseUrl = (companyUuid: string) =>
  `/v1/companies/${resolveCompanyUuid(companyUuid)}/geographies`

function companyHeader(companyUuid: string): string {
  return resolveCompanyUuid(companyUuid)
}

export async function getGeographies(
  companyUuid: string,
  params?: GeographyListParams
) {
  const resolved = companyHeader(companyUuid)
  const queryParams = params ? { ...params, query: (params as Record<string, unknown>).query ?? (params as Record<string, unknown>).search } as GeographyListParams : params
  if (queryParams && "search" in (queryParams as Record<string, unknown>)) delete (queryParams as Record<string, unknown>).search
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<GeographyResponse>>
  >(baseUrl(companyUuid), {
    params: queryParams,
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function getGeography(
  companyUuid: string,
  geographyUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<GeographyResponse>
  >(`${baseUrl(companyUuid)}/${geographyUuid}`, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function createGeography(
  companyUuid: string,
  input: CreateGeographyRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<
    ApiSuccessResponse<GeographyResponse>
  >(baseUrl(companyUuid), input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function updateGeography(
  companyUuid: string,
  geographyUuid: string,
  input: UpdateGeographyRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.put<
    ApiSuccessResponse<GeographyResponse>
  >(`${baseUrl(companyUuid)}/${geographyUuid}`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function updateGeographyStatus(
  companyUuid: string,
  geographyUuid: string,
  input: UpdateGeographyStatusRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.patch<
    ApiSuccessResponse<GeographyResponse>
  >(`${baseUrl(companyUuid)}/${geographyUuid}/status`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}
