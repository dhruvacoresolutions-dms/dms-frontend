import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import type {
  VehicleModelResponse,
  CreateVehicleModelRequest,
  UpdateVehicleModelRequest,
  UpdateVehicleModelStatusRequest,
  VehicleModelListParams,
  VehicleModelImportResponse,
} from "./vehicle-model.types"
import type { PageResponse } from "@/features/companies/api/company.types"

function resolveCompanyUuid(companyUuid: string): string {
  if (companyUuid !== "current") return companyUuid
  return useAuthStore.getState().session?.user?.companyUuid ?? companyUuid
}

const baseUrl = (companyUuid: string) =>
  `/api/v1/companies/${resolveCompanyUuid(companyUuid)}/vehicle-models`

function companyHeader(companyUuid: string): string {
  return resolveCompanyUuid(companyUuid)
}

export async function getVehicleModels(
  companyUuid: string,
  params?: VehicleModelListParams
) {
  const resolved = companyHeader(companyUuid)
  const rawParams = params as Record<string, unknown> | undefined
  const term = (rawParams?.query ?? rawParams?.search) as string | undefined
  const queryParams = params ? { ...params, query: term, search: term } : params
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<VehicleModelResponse>>
  >(baseUrl(companyUuid), {
    params: queryParams,
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function getVehicleModel(
  companyUuid: string,
  modelUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<VehicleModelResponse>
  >(`${baseUrl(companyUuid)}/${modelUuid}`, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function createVehicleModel(
  companyUuid: string,
  input: CreateVehicleModelRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<
    ApiSuccessResponse<VehicleModelResponse>
  >(baseUrl(companyUuid), input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function updateVehicleModel(
  companyUuid: string,
  modelUuid: string,
  input: UpdateVehicleModelRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.put<
    ApiSuccessResponse<VehicleModelResponse>
  >(`${baseUrl(companyUuid)}/${modelUuid}`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function updateVehicleModelStatus(
  companyUuid: string,
  modelUuid: string,
  input: UpdateVehicleModelStatusRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.patch<
    ApiSuccessResponse<VehicleModelResponse>
  >(`${baseUrl(companyUuid)}/${modelUuid}/status`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

// ── Bulk Import ────────────────────────────────────────────────────────────
// Backend: GET .../vehicle-models/import/template?format=csv|xlsx,
// POST .../vehicle-models/import (multipart `file`).

export async function getVehicleModelImportTemplate(
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

export async function uploadVehicleModelImport(
  companyUuid: string,
  file: File
) {
  const resolved = companyHeader(companyUuid)
  const form = new FormData()
  form.append("file", file, file.name)
  const { data } = await apiClient.post<
    ApiSuccessResponse<VehicleModelImportResponse>
  >(`${baseUrl(companyUuid)}/import`, form, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

// ── Master Data Export ───────────────────────────────────────────────────────

export type ExportVehicleModelsFilters = {
  search?: string
}

export async function exportVehicleModels(
  companyUuid: string,
  format: "csv" | "xlsx",
  filters?: ExportVehicleModelsFilters
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
