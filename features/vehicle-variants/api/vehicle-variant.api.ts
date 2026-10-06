import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import type {
  VehicleVariantResponse,
  CreateVehicleVariantRequest,
  UpdateVehicleVariantRequest,
  UpdateVehicleVariantStatusRequest,
  VehicleVariantListParams,
  VehicleVariantImportResponse,
} from "./vehicle-variant.types"
import type { PageResponse } from "@/features/companies/api/company.types"

function resolveCompanyUuid(companyUuid: string): string {
  if (companyUuid !== "current") return companyUuid
  return useAuthStore.getState().session?.user?.companyUuid ?? companyUuid
}

const baseUrl = (companyUuid: string) =>
  `/api/v1/companies/${resolveCompanyUuid(companyUuid)}/vehicle-variants`

function companyHeader(companyUuid: string): string {
  return resolveCompanyUuid(companyUuid)
}

export async function getVehicleVariants(
  companyUuid: string,
  params?: VehicleVariantListParams
) {
  const resolved = companyHeader(companyUuid)
  const rawParams = params as Record<string, unknown> | undefined
  const term = (rawParams?.query ?? rawParams?.search) as string | undefined
  const queryParams = params ? { ...params, query: term, search: term } : params
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<VehicleVariantResponse>>
  >(baseUrl(companyUuid), {
    params: queryParams,
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function getVehicleVariant(
  companyUuid: string,
  variantUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<VehicleVariantResponse>
  >(`${baseUrl(companyUuid)}/${variantUuid}`, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function createVehicleVariant(
  companyUuid: string,
  input: CreateVehicleVariantRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<
    ApiSuccessResponse<VehicleVariantResponse>
  >(baseUrl(companyUuid), input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function updateVehicleVariant(
  companyUuid: string,
  variantUuid: string,
  input: UpdateVehicleVariantRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.put<
    ApiSuccessResponse<VehicleVariantResponse>
  >(`${baseUrl(companyUuid)}/${variantUuid}`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function updateVehicleVariantStatus(
  companyUuid: string,
  variantUuid: string,
  input: UpdateVehicleVariantStatusRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.patch<
    ApiSuccessResponse<VehicleVariantResponse>
  >(`${baseUrl(companyUuid)}/${variantUuid}/status`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

// ── Bulk Import ────────────────────────────────────────────────────────────
// Backend: GET .../vehicle-variants/import/template?format=csv|xlsx,
// POST .../vehicle-variants/import (multipart `file`).

export async function getVehicleVariantImportTemplate(
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

export async function uploadVehicleVariantImport(
  companyUuid: string,
  file: File
) {
  const resolved = companyHeader(companyUuid)
  const form = new FormData()
  form.append("file", file, file.name)
  const { data } = await apiClient.post<
    ApiSuccessResponse<VehicleVariantImportResponse>
  >(`${baseUrl(companyUuid)}/import`, form, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

// ── Master Data Export ───────────────────────────────────────────────────────

export type ExportVehicleVariantsFilters = {
  search?: string
  status?: string
  modelUuid?: string
}

export async function exportVehicleVariants(
  companyUuid: string,
  format: "csv" | "xlsx",
  filters?: ExportVehicleVariantsFilters
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<Blob>(`${baseUrl(companyUuid)}/export`, {
    headers: { "X-Company-Context": resolved },
    params: {
      format,
      query: filters?.search || undefined,
      search: filters?.search || undefined,
      status: filters?.status || undefined,
      modelUuid: filters?.modelUuid || undefined,
    },
    responseType: "blob",
    timeout: 60_000,
  })
  return data
}
