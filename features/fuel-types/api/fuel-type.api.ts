import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import type {
  FuelTypeResponse,
  CreateFuelTypeRequest,
  UpdateFuelTypeRequest,
  UpdateFuelTypeStatusRequest,
  FuelTypeListParams,
  FuelTypeImportResponse,
} from "./fuel-type.types"
import type { PageResponse } from "@/features/companies/api/company.types"

function resolveCompanyUuid(companyUuid: string): string {
  if (companyUuid !== "current") return companyUuid
  return useAuthStore.getState().session?.user?.companyUuid ?? companyUuid
}

const baseUrl = (companyUuid: string) =>
  `/api/v1/companies/${resolveCompanyUuid(companyUuid)}/fuel-types`

function companyHeader(companyUuid: string): string {
  return resolveCompanyUuid(companyUuid)
}

export async function getFuelTypes(
  companyUuid: string,
  params?: FuelTypeListParams
) {
  const resolved = companyHeader(companyUuid)
  const rawParams = params as Record<string, unknown> | undefined
  const term = (rawParams?.query ?? rawParams?.search) as string | undefined
  const queryParams = params ? { ...params, query: term, search: term } : params
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<FuelTypeResponse>>
  >(baseUrl(companyUuid), {
    params: queryParams,
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function getFuelType(
  companyUuid: string,
  fuelTypeUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<FuelTypeResponse>
  >(`${baseUrl(companyUuid)}/${fuelTypeUuid}`, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function createFuelType(
  companyUuid: string,
  input: CreateFuelTypeRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<
    ApiSuccessResponse<FuelTypeResponse>
  >(baseUrl(companyUuid), input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function updateFuelType(
  companyUuid: string,
  fuelTypeUuid: string,
  input: UpdateFuelTypeRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.put<
    ApiSuccessResponse<FuelTypeResponse>
  >(`${baseUrl(companyUuid)}/${fuelTypeUuid}`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function updateFuelTypeStatus(
  companyUuid: string,
  fuelTypeUuid: string,
  input: UpdateFuelTypeStatusRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.patch<
    ApiSuccessResponse<FuelTypeResponse>
  >(`${baseUrl(companyUuid)}/${fuelTypeUuid}/status`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

// ── Bulk Import ────────────────────────────────────────────────────────────
// Backend: GET .../fuel-types/import/template?format=csv|xlsx,
// POST .../fuel-types/import (multipart `file`).

export async function getFuelTypeImportTemplate(
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

export async function uploadFuelTypeImport(companyUuid: string, file: File) {
  const resolved = companyHeader(companyUuid)
  const form = new FormData()
  form.append("file", file, file.name)
  const { data } = await apiClient.post<
    ApiSuccessResponse<FuelTypeImportResponse>
  >(`${baseUrl(companyUuid)}/import`, form, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

// ── Master Data Export ───────────────────────────────────────────────────────

export type ExportFuelTypesFilters = {
  search?: string
}

export async function exportFuelTypes(
  companyUuid: string,
  format: "csv" | "xlsx",
  filters?: ExportFuelTypesFilters
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
