import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import type {
  CompanySummaryResponse,
  CreateCompanyRequest,
  CreateCompanyResponse,
  AddressResponse,
  CreateAddressRequest,
  FeatureEntitlementRequest,
  PageResponse,
  CompanyListParams,
} from "./company.types"

export async function getCompanies(params?: CompanyListParams) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<CompanySummaryResponse>>
  >("/v1/companies", { params })
  return data.data
}

export async function getCompany(companyUuid: string) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<CompanySummaryResponse>
  >(`/v1/companies/${companyUuid}`, {
    headers: { "X-Company-Context": companyUuid },
  })
  return data.data
}

export async function createCompany(input: CreateCompanyRequest) {
  const { data } = await apiClient.post<
    ApiSuccessResponse<CreateCompanyResponse>
  >("/v1/companies", input)
  return data.data
}

export async function getCompanyAddresses(companyUuid: string) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<AddressResponse[]>
  >(`/v1/companies/${companyUuid}/addresses`, {
    headers: { "X-Company-Context": companyUuid },
  })
  return data.data
}

export async function addCompanyAddress(
  companyUuid: string,
  input: CreateAddressRequest
) {
  const { data } = await apiClient.post<
    ApiSuccessResponse<AddressResponse>
  >(`/v1/companies/${companyUuid}/addresses`, input, {
    headers: { "X-Company-Context": companyUuid },
  })
  return data.data
}

export async function updateCompanyFeatures(
  companyUuid: string,
  input: FeatureEntitlementRequest
) {
  const { data } = await apiClient.put<
    ApiSuccessResponse<CompanySummaryResponse>
  >(`/v1/companies/${companyUuid}/features`, input, {
    headers: { "X-Company-Context": companyUuid },
  })
  return data.data
}
