import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import type {
  ProductFieldTemplateResponse,
  UpdateProductFieldTemplateRequest,
} from "./product-field-template.types"

function resolveCompanyUuid(companyUuid: string): string {
  if (companyUuid !== "current") return companyUuid
  return useAuthStore.getState().session?.user?.companyUuid ?? companyUuid
}

const baseUrl = (companyUuid: string) =>
  `/api/v1/companies/${resolveCompanyUuid(companyUuid)}/product-field-template`

const effectiveUrl = (companyUuid: string) =>
  `/api/v1/companies/${resolveCompanyUuid(companyUuid)}/product-field-templates/effective`

function companyHeader(companyUuid: string): string {
  return resolveCompanyUuid(companyUuid)
}

export async function getProductFieldTemplate(companyUuid: string) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<ProductFieldTemplateResponse>
  >(baseUrl(companyUuid), {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function getEffectiveProductFieldTemplate(companyUuid: string) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<ProductFieldTemplateResponse>
  >(effectiveUrl(companyUuid), {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function updateProductFieldTemplate(
  companyUuid: string,
  input: UpdateProductFieldTemplateRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.put<
    ApiSuccessResponse<ProductFieldTemplateResponse>
  >(baseUrl(companyUuid), input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}
