import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
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

function resolveCompanyUuid(companyUuid: string): string {
  if (companyUuid !== "current") return companyUuid
  return useAuthStore.getState().session?.user?.companyUuid ?? companyUuid
}

export async function getCompanies(params?: CompanyListParams) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<CompanySummaryResponse>>
  >("/v1/companies", { params })
  return data.data
}

export async function getCompany(companyUuid: string) {
  const resolved = resolveCompanyUuid(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<CompanySummaryResponse>
  >(`/v1/companies/${resolved}`, {
    headers: { "X-Company-Context": resolved },
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
  const resolved = resolveCompanyUuid(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<AddressResponse[]>
  >(`/v1/companies/${resolved}/addresses`, {
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
  >(`/v1/companies/${resolved}/addresses`, input, {
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
  >(`/v1/companies/${resolved}/features`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}
