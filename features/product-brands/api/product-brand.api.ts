import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import type {
  ProductBrandResponse,
  CreateProductBrandRequest,
  UpdateProductBrandRequest,
  UpdateProductBrandStatusRequest,
  ProductBrandListParams,
  ProductBrandImportResultResponse,
} from "./product-brand.types"
import type { PageResponse } from "@/features/companies/api/company.types"

function resolveCompanyUuid(companyUuid: string): string {
  if (companyUuid !== "current") return companyUuid
  return useAuthStore.getState().session?.user?.companyUuid ?? companyUuid
}

const baseUrl = (companyUuid: string) =>
  `/api/v1/companies/${resolveCompanyUuid(companyUuid)}/product-brands`

function companyHeader(companyUuid: string): string {
  return resolveCompanyUuid(companyUuid)
}

export async function getProductBrands(
  companyUuid: string,
  params?: ProductBrandListParams
) {
  const resolved = companyHeader(companyUuid)
  // Send both `query` and `search`: different backend endpoints honor
  // different names, unknown params are ignored.
  const rawParams = params as Record<string, unknown> | undefined
  const term = (rawParams?.query ?? rawParams?.search) as string | undefined
  const queryParams = params ? { ...params, query: term, search: term } : params
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<ProductBrandResponse>>
  >(baseUrl(companyUuid), {
    params: queryParams,
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function getProductBrand(companyUuid: string, brandUuid: string) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<ProductBrandResponse>
  >(`${baseUrl(companyUuid)}/${brandUuid}`, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function createProductBrand(
  companyUuid: string,
  input: CreateProductBrandRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<
    ApiSuccessResponse<ProductBrandResponse>
  >(baseUrl(companyUuid), input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function updateProductBrand(
  companyUuid: string,
  brandUuid: string,
  input: UpdateProductBrandRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.put<
    ApiSuccessResponse<ProductBrandResponse>
  >(`${baseUrl(companyUuid)}/${brandUuid}`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function updateProductBrandStatus(
  companyUuid: string,
  brandUuid: string,
  input: UpdateProductBrandStatusRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.patch<
    ApiSuccessResponse<ProductBrandResponse>
  >(`${baseUrl(companyUuid)}/${brandUuid}/status`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

// ── Master Data Export ───────────────────────────────────────────────────────
// Mirrors the geography/department export shape:
// GET /api/v1/companies/{companyUuid}/product-brands/export?format=csv|xlsx

export type ExportProductBrandsFilters = {
  search?: string
}

export async function exportProductBrands(
  companyUuid: string,
  format: "csv" | "xlsx",
  filters?: ExportProductBrandsFilters
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<Blob>(`${baseUrl(companyUuid)}/export`, {
    headers: { "X-Company-Context": resolved },
    params: {
      format,
      query: filters?.search || undefined,
      search: filters?.search || undefined,
    },
    responseType: "blob",
    timeout: 60_000,
  })
  return data
}

// ── Bulk Import ──────────────────────────────────────────────────────────────
// Backend: GET .../product-brands/import/template?format=csv|xlsx
//          POST .../product-brands/import (multipart `file`)

export async function getProductBrandImportTemplate(
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

export async function uploadProductBrandImport(
  companyUuid: string,
  file: File
) {
  const resolved = companyHeader(companyUuid)
  const form = new FormData()
  form.append("file", file, file.name)
  const { data } = await apiClient.post<
    ApiSuccessResponse<ProductBrandImportResultResponse>
  >(`${baseUrl(companyUuid)}/import`, form, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}
