import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import type {
  ProductCategoryResponse,
  CreateProductCategoryRequest,
  UpdateProductCategoryRequest,
  UpdateProductCategoryStatusRequest,
  MoveProductCategoryParentRequest,
  ProductCategoryListParams,
  ProductCategoryImportResultResponse,
} from "./product-category.types"
import type { PageResponse } from "@/features/companies/api/company.types"

function resolveCompanyUuid(companyUuid: string): string {
  if (companyUuid !== "current") return companyUuid
  return useAuthStore.getState().session?.user?.companyUuid ?? companyUuid
}

const baseUrl = (companyUuid: string) =>
  `/api/v1/companies/${resolveCompanyUuid(companyUuid)}/product-categories`

function companyHeader(companyUuid: string): string {
  return resolveCompanyUuid(companyUuid)
}

export async function getProductCategories(
  companyUuid: string,
  params?: ProductCategoryListParams
) {
  const resolved = companyHeader(companyUuid)
  // Send both `query` and `search`: different backend endpoints honor
  // different names, unknown params are ignored.
  const rawParams = params as Record<string, unknown> | undefined
  const term = (rawParams?.query ?? rawParams?.search) as string | undefined
  const queryParams = params ? { ...params, query: term, search: term } : params
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<ProductCategoryResponse>>
  >(baseUrl(companyUuid), {
    params: queryParams,
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function getProductCategory(
  companyUuid: string,
  categoryUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<ProductCategoryResponse>
  >(`${baseUrl(companyUuid)}/${categoryUuid}`, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function createProductCategory(
  companyUuid: string,
  input: CreateProductCategoryRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<
    ApiSuccessResponse<ProductCategoryResponse>
  >(baseUrl(companyUuid), input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function updateProductCategory(
  companyUuid: string,
  categoryUuid: string,
  input: UpdateProductCategoryRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.put<
    ApiSuccessResponse<ProductCategoryResponse>
  >(`${baseUrl(companyUuid)}/${categoryUuid}`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function moveProductCategoryParent(
  companyUuid: string,
  categoryUuid: string,
  input: MoveProductCategoryParentRequest
) {
  const resolved = companyHeader(companyUuid)
  // Backend field name is `newParentCategoryUuid` (see Postman folder
  // "12 - Product Categories & UOMs" > Move Product Category Parent).
  const body: Record<string, unknown> = {
    newParentCategoryUuid: input.parentCategoryUuid,
  }
  if (input.version !== undefined) body.version = input.version
  const { data } = await apiClient.patch<
    ApiSuccessResponse<ProductCategoryResponse>
  >(`${baseUrl(companyUuid)}/${categoryUuid}/parent`, body, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function updateProductCategoryStatus(
  companyUuid: string,
  categoryUuid: string,
  input: UpdateProductCategoryStatusRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.patch<
    ApiSuccessResponse<ProductCategoryResponse>
  >(`${baseUrl(companyUuid)}/${categoryUuid}/status`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

// ── Master Data Export ───────────────────────────────────────────────────────
// Mirrors the geography/department export shape:
// GET /api/v1/companies/{companyUuid}/product-categories/export?format=csv|xlsx

export type ExportProductCategoriesFilters = {
  search?: string
}

export async function exportProductCategories(
  companyUuid: string,
  format: "csv" | "xlsx",
  filters?: ExportProductCategoriesFilters
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
// Backend: GET .../product-categories/import/template?format=csv|xlsx
//          POST .../product-categories/import (multipart `file`)

export async function getProductCategoryImportTemplate(
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

export async function uploadProductCategoryImport(
  companyUuid: string,
  file: File
) {
  const resolved = companyHeader(companyUuid)
  const form = new FormData()
  form.append("file", file, file.name)
  const { data } = await apiClient.post<
    ApiSuccessResponse<ProductCategoryImportResultResponse>
  >(`${baseUrl(companyUuid)}/import`, form, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}
