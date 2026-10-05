import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import type {
  ProductUomResponse,
  CreateProductUomRequest,
  UpdateProductUomRequest,
  UpdateProductUomStatusRequest,
  ProductUomListParams,
  ProductUomImportResultResponse,
} from "./product-uom.types"
import type { PageResponse } from "@/features/companies/api/company.types"

function resolveCompanyUuid(companyUuid: string): string {
  if (companyUuid !== "current") return companyUuid
  return useAuthStore.getState().session?.user?.companyUuid ?? companyUuid
}

const baseUrl = (companyUuid: string) =>
  `/api/v1/companies/${resolveCompanyUuid(companyUuid)}/product-uoms`

function companyHeader(companyUuid: string): string {
  return resolveCompanyUuid(companyUuid)
}

export async function getProductUoms(
  companyUuid: string,
  params?: ProductUomListParams
) {
  const resolved = companyHeader(companyUuid)
  // Send both `query` and `search`: different backend endpoints honor
  // different names, unknown params are ignored.
  const rawParams = params as Record<string, unknown> | undefined
  const term = (rawParams?.query ?? rawParams?.search) as string | undefined
  const queryParams = params ? { ...params, query: term, search: term } : params
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<ProductUomResponse>>
  >(baseUrl(companyUuid), {
    params: queryParams,
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function getProductUom(companyUuid: string, uomUuid: string) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<ApiSuccessResponse<ProductUomResponse>>(
    `${baseUrl(companyUuid)}/${uomUuid}`,
    {
      headers: { "X-Company-Context": resolved },
    }
  )
  return data.data
}

export async function createProductUom(
  companyUuid: string,
  input: CreateProductUomRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<ApiSuccessResponse<ProductUomResponse>>(
    baseUrl(companyUuid),
    input,
    {
      headers: { "X-Company-Context": resolved },
    }
  )
  return data.data
}

export async function updateProductUom(
  companyUuid: string,
  uomUuid: string,
  input: UpdateProductUomRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.put<ApiSuccessResponse<ProductUomResponse>>(
    `${baseUrl(companyUuid)}/${uomUuid}`,
    input,
    {
      headers: { "X-Company-Context": resolved },
    }
  )
  return data.data
}

export async function updateProductUomStatus(
  companyUuid: string,
  uomUuid: string,
  input: UpdateProductUomStatusRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.patch<
    ApiSuccessResponse<ProductUomResponse>
  >(`${baseUrl(companyUuid)}/${uomUuid}/status`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

// ── Master Data Export ───────────────────────────────────────────────────────
// Mirrors the geography/department export shape:
// GET /api/v1/companies/{companyUuid}/product-uoms/export?format=csv|xlsx

export type ExportProductUomsFilters = {
  search?: string
  status?: string
}

export async function exportProductUoms(
  companyUuid: string,
  format: "csv" | "xlsx",
  filters?: ExportProductUomsFilters
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<Blob>(`${baseUrl(companyUuid)}/export`, {
    headers: { "X-Company-Context": resolved },
    params: {
      format,
      query: filters?.search || undefined,
      search: filters?.search || undefined,
      status: filters?.status || undefined,
    },
    responseType: "blob",
    timeout: 60_000,
  })
  return data
}

// ── Bulk Import ──────────────────────────────────────────────────────────────
// Backend: GET .../product-uoms/import/template?format=csv|xlsx
//          POST .../product-uoms/import (multipart `file`)

export async function getProductUomImportTemplate(
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

export async function uploadProductUomImport(companyUuid: string, file: File) {
  const resolved = companyHeader(companyUuid)
  const form = new FormData()
  form.append("file", file, file.name)
  const { data } = await apiClient.post<
    ApiSuccessResponse<ProductUomImportResultResponse>
  >(`${baseUrl(companyUuid)}/import`, form, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}
