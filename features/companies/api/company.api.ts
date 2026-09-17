import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import type {
  CompanySummaryResponse,
  CreateCompanyRequest,
  CreateCompanyResponse,
  UpdateCompanyRequest,
  UpdateCompanyStatusRequest,
  AddressResponse,
  CreateAddressRequest,
  FeatureEntitlementRequest,
  PageResponse,
  CompanyListParams,
  CompanyAddressListParams,
} from "./company.types"

function resolveCompanyUuid(companyUuid: string): string {
  if (companyUuid !== "current") return companyUuid
  return useAuthStore.getState().session?.user?.companyUuid ?? companyUuid
}

export async function getCompanies(params?: CompanyListParams) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<CompanySummaryResponse>>
  >("/api/v1/companies", { params })
  return data.data
}

export async function getCompany(companyUuid: string) {
  const resolved = resolveCompanyUuid(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<CompanySummaryResponse>
  >(`/api/v1/companies/${resolved}`, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function createCompany(input: CreateCompanyRequest) {
  const { data } = await apiClient.post<
    ApiSuccessResponse<CreateCompanyResponse>
  >("/api/v1/companies", input)
  return data.data
}

export async function updateCompany(
  companyUuid: string,
  input: UpdateCompanyRequest
) {
  const resolved = resolveCompanyUuid(companyUuid)
  const { data } = await apiClient.put<
    ApiSuccessResponse<CompanySummaryResponse>
  >(`/api/v1/companies/${resolved}`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function updateCompanyStatus(
  companyUuid: string,
  input: UpdateCompanyStatusRequest
) {
  const resolved = resolveCompanyUuid(companyUuid)
  const { data } = await apiClient.patch<
    ApiSuccessResponse<CompanySummaryResponse>
  >(`/api/v1/companies/${resolved}/status`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function getCompanyAddresses(
  companyUuid: string,
  params?: CompanyAddressListParams
) {
  const resolved = resolveCompanyUuid(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<AddressResponse[]>
  >(`/api/v1/companies/${resolved}/addresses`, {
    params,
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function addCompanyAddress(
  companyUuid: string,
  input: CreateAddressRequest
) {
  const resolved = resolveCompanyUuid(companyUuid)
  const { data } = await apiClient.post<
    ApiSuccessResponse<AddressResponse>
  >(`/api/v1/companies/${resolved}/addresses`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function updateCompanyFeatures(
  companyUuid: string,
  input: FeatureEntitlementRequest
) {
  const resolved = resolveCompanyUuid(companyUuid)
  const { data } = await apiClient.put<
    ApiSuccessResponse<CompanySummaryResponse>
  >(`/api/v1/companies/${resolved}/features`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}
