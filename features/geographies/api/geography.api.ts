import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import type {
  GeographyResponse,
  CreateGeographyRequest,
  UpdateGeographyRequest,
  UpdateGeographyStatusRequest,
  GeographyListParams,
} from "./geography.types"
import type { PageResponse } from "@/features/companies/api/company.types"

const baseUrl = (companyUuid: string) =>
  `/v1/companies/${companyUuid}/geographies`

export async function getGeographies(
  companyUuid: string,
  params?: GeographyListParams
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<GeographyResponse>>
  >(baseUrl(companyUuid), {
    params,
    headers: { "X-Company-Context": companyUuid },
  })
  return data.data
}

export async function getGeography(
  companyUuid: string,
  geographyUuid: string
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<GeographyResponse>
  >(`${baseUrl(companyUuid)}/${geographyUuid}`, {
    headers: { "X-Company-Context": companyUuid },
  })
  return data.data
}

export async function createGeography(
  companyUuid: string,
  input: CreateGeographyRequest
) {
  const { data } = await apiClient.post<
    ApiSuccessResponse<GeographyResponse>
  >(baseUrl(companyUuid), input, {
    headers: { "X-Company-Context": companyUuid },
  })
  return data.data
}

export async function updateGeography(
  companyUuid: string,
  geographyUuid: string,
  input: UpdateGeographyRequest
) {
  const { data } = await apiClient.put<
    ApiSuccessResponse<GeographyResponse>
  >(`${baseUrl(companyUuid)}/${geographyUuid}`, input, {
    headers: { "X-Company-Context": companyUuid },
  })
  return data.data
}

export async function updateGeographyStatus(
  companyUuid: string,
  geographyUuid: string,
  input: UpdateGeographyStatusRequest
) {
  const { data } = await apiClient.patch<
    ApiSuccessResponse<GeographyResponse>
  >(`${baseUrl(companyUuid)}/${geographyUuid}/status`, input, {
    headers: { "X-Company-Context": companyUuid },
  })
  return data.data
}
