import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import type {
  ProductAttributeTemplateResponse,
  CreateProductAttributeTemplateRequest,
  UpdateProductAttributeTemplateRequest,
  UpdateProductAttributeTemplateStatusRequest,
  ProductAttributeTemplateListParams,
  ProductAttributeOptionResponse,
  CreateProductAttributeOptionRequest,
  UpdateProductAttributeOptionRequest,
  UpdateProductAttributeOptionStatusRequest,
  ProductAttributeTemplateImportResult,
} from "./product-attribute-template.types"
import type { PageResponse } from "@/features/companies/api/company.types"

function resolveCompanyUuid(companyUuid: string): string {
  if (companyUuid !== "current") return companyUuid
  return useAuthStore.getState().session?.user?.companyUuid ?? companyUuid
}

const baseUrl = (companyUuid: string) =>
  `/api/v1/companies/${resolveCompanyUuid(companyUuid)}/product-attribute-templates`

function companyHeader(companyUuid: string): string {
  return resolveCompanyUuid(companyUuid)
}

export async function getProductAttributeTemplates(
  companyUuid: string,
  params?: ProductAttributeTemplateListParams
) {
  const resolved = companyHeader(companyUuid)
  // Send both `query` and `search`: different backend endpoints honor
  // different names, unknown params are ignored.
  const rawParams = params as Record<string, unknown> | undefined
  const term = (rawParams?.query ?? rawParams?.search) as string | undefined
  const queryParams = params ? { ...params, query: term, search: term } : params
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<ProductAttributeTemplateResponse>>
  >(baseUrl(companyUuid), {
    params: queryParams,
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function getProductAttributeTemplate(
  companyUuid: string,
  attributeTemplateUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<ProductAttributeTemplateResponse>
  >(`${baseUrl(companyUuid)}/${attributeTemplateUuid}`, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function createProductAttributeTemplate(
  companyUuid: string,
  input: CreateProductAttributeTemplateRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<
    ApiSuccessResponse<ProductAttributeTemplateResponse>
  >(baseUrl(companyUuid), input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function updateProductAttributeTemplate(
  companyUuid: string,
  attributeTemplateUuid: string,
  input: UpdateProductAttributeTemplateRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.put<
    ApiSuccessResponse<ProductAttributeTemplateResponse>
  >(`${baseUrl(companyUuid)}/${attributeTemplateUuid}`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function updateProductAttributeTemplateStatus(
  companyUuid: string,
  attributeTemplateUuid: string,
  input: UpdateProductAttributeTemplateStatusRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.patch<
    ApiSuccessResponse<ProductAttributeTemplateResponse>
  >(`${baseUrl(companyUuid)}/${attributeTemplateUuid}/status`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

// ── Options (bare list, not paged) ───────────────────────────────────────────

export async function getProductAttributeOptions(
  companyUuid: string,
  attributeTemplateUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<ProductAttributeOptionResponse[]>
  >(`${baseUrl(companyUuid)}/${attributeTemplateUuid}/options`, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function createProductAttributeOption(
  companyUuid: string,
  attributeTemplateUuid: string,
  input: CreateProductAttributeOptionRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<
    ApiSuccessResponse<ProductAttributeOptionResponse>
  >(`${baseUrl(companyUuid)}/${attributeTemplateUuid}/options`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function updateProductAttributeOption(
  companyUuid: string,
  attributeTemplateUuid: string,
  optionUuid: string,
  input: UpdateProductAttributeOptionRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.put<
    ApiSuccessResponse<ProductAttributeOptionResponse>
  >(
    `${baseUrl(companyUuid)}/${attributeTemplateUuid}/options/${optionUuid}`,
    input,
    {
      headers: { "X-Company-Context": resolved },
    }
  )
  return data.data
}

export async function updateProductAttributeOptionStatus(
  companyUuid: string,
  attributeTemplateUuid: string,
  optionUuid: string,
  input: UpdateProductAttributeOptionStatusRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.patch<
    ApiSuccessResponse<ProductAttributeOptionResponse>
  >(
    `${baseUrl(companyUuid)}/${attributeTemplateUuid}/options/${optionUuid}/status`,
    input,
    {
      headers: { "X-Company-Context": resolved },
    }
  )
  return data.data
}

// ── Bulk Import (direct result, not a job) ───────────────────────────────────

export async function getProductAttributeTemplateImportTemplate(
  companyUuid: string,
  format?: "csv" | "xlsx"
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<Blob>(
    `${baseUrl(companyUuid)}/import/template`,
    {
      headers: { "X-Company-Context": resolved },
      params: format ? { format } : undefined,
      responseType: "blob",
    }
  )
  return data
}

export async function uploadProductAttributeTemplateImport(
  companyUuid: string,
  file: File
) {
  const resolved = companyHeader(companyUuid)
  const form = new FormData()
  form.append("file", file, file.name)
  const { data } = await apiClient.post<
    ApiSuccessResponse<ProductAttributeTemplateImportResult>
  >(`${baseUrl(companyUuid)}/import`, form, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}
