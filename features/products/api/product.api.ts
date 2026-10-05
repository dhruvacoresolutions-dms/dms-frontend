import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import type { PageResponse } from "@/features/companies/api/company.types"
import type {
  ProductResponse,
  CreateProductRequest,
  UpdateProductRequest,
  ProductLifecycleRequest,
  ProductListParams,
} from "./product.types"

function resolveCompanyUuid(companyUuid: string): string {
  if (companyUuid !== "current") return companyUuid
  return useAuthStore.getState().session?.user?.companyUuid ?? companyUuid
}

const baseUrl = (companyUuid: string) =>
  `/api/v1/companies/${resolveCompanyUuid(companyUuid)}/products`

function companyHeader(companyUuid: string): string {
  return resolveCompanyUuid(companyUuid)
}

export async function getProducts(
  companyUuid: string,
  params?: ProductListParams
) {
  const resolved = companyHeader(companyUuid)
  const rawParams = params as Record<string, unknown> | undefined
  const term = (rawParams?.query ?? rawParams?.search) as string | undefined
  const queryParams = params ? { ...params, query: term, search: term } : params
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<ProductResponse>>
  >(baseUrl(companyUuid), {
    params: queryParams,
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function getProduct(companyUuid: string, productUuid: string) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<ApiSuccessResponse<ProductResponse>>(
    `${baseUrl(companyUuid)}/${productUuid}`,
    { headers: { "X-Company-Context": resolved } }
  )
  return data.data
}

export async function createProduct(
  companyUuid: string,
  input: CreateProductRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<ApiSuccessResponse<ProductResponse>>(
    baseUrl(companyUuid),
    input,
    { headers: { "X-Company-Context": resolved } }
  )
  return data.data
}

export async function updateProduct(
  companyUuid: string,
  productUuid: string,
  input: UpdateProductRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.put<ApiSuccessResponse<ProductResponse>>(
    `${baseUrl(companyUuid)}/${productUuid}`,
    input,
    { headers: { "X-Company-Context": resolved } }
  )
  return data.data
}

export async function publishProduct(
  companyUuid: string,
  productUuid: string,
  input: ProductLifecycleRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.patch<ApiSuccessResponse<ProductResponse>>(
    `${baseUrl(companyUuid)}/${productUuid}/publish`,
    input,
    { headers: { "X-Company-Context": resolved } }
  )
  return data.data
}

export async function deactivateProduct(
  companyUuid: string,
  productUuid: string,
  input: ProductLifecycleRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.patch<ApiSuccessResponse<ProductResponse>>(
    `${baseUrl(companyUuid)}/${productUuid}/deactivate`,
    input,
    { headers: { "X-Company-Context": resolved } }
  )
  return data.data
}

export async function reactivateProduct(
  companyUuid: string,
  productUuid: string,
  input: ProductLifecycleRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.patch<ApiSuccessResponse<ProductResponse>>(
    `${baseUrl(companyUuid)}/${productUuid}/reactivate`,
    input,
    { headers: { "X-Company-Context": resolved } }
  )
  return data.data
}

// ── Export / Import ──────────────────────────────────────────────────────────

export type ExportProductsFilters = {
  search?: string
  status?: string
}

export async function exportProducts(
  companyUuid: string,
  format: "csv" | "xlsx",
  filters?: ExportProductsFilters
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

export async function getProductImportTemplate(
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

export async function uploadProductImport(companyUuid: string, file: File) {
  const resolved = companyHeader(companyUuid)
  const form = new FormData()
  form.append("file", file, file.name)
  const { data } = await apiClient.post<
    ApiSuccessResponse<{ importJobUuid?: string } & Record<string, unknown>>
  >(`${baseUrl(companyUuid)}/import`, form, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function getProductPriceImportTemplate(
  companyUuid: string,
  format?: "csv" | "xlsx"
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<Blob>(
    `/api/v1/companies/${resolved}/product-prices/import/template`,
    {
      headers: { "X-Company-Context": resolved },
      params: format ? { format } : undefined,
      responseType: "blob",
    }
  )
  return data
}

export async function uploadProductPriceImport(companyUuid: string, file: File) {
  const resolved = companyHeader(companyUuid)
  const form = new FormData()
  form.append("file", file, file.name)
  const { data } = await apiClient.post<
    ApiSuccessResponse<{ importJobUuid?: string } & Record<string, unknown>>
  >(`/api/v1/companies/${resolved}/product-prices/import`, form, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}
