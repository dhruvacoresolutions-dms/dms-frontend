import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import type {
  FitmentPositionResponse,
  CreateFitmentPositionRequest,
  UpdateFitmentPositionRequest,
  UpdateFitmentPositionStatusRequest,
  FitmentPositionListParams,
  FitmentPositionImportResponse,
} from "./fitment-position.types"
import type { PageResponse } from "@/features/companies/api/company.types"

function resolveCompanyUuid(companyUuid: string): string {
  if (companyUuid !== "current") return companyUuid
  return useAuthStore.getState().session?.user?.companyUuid ?? companyUuid
}

const baseUrl = (companyUuid: string) =>
  `/api/v1/companies/${resolveCompanyUuid(companyUuid)}/fitment-positions`

function companyHeader(companyUuid: string): string {
  return resolveCompanyUuid(companyUuid)
}

export async function getFitmentPositions(
  companyUuid: string,
  params?: FitmentPositionListParams
) {
  const resolved = companyHeader(companyUuid)
  const rawParams = params as Record<string, unknown> | undefined
  const term = (rawParams?.query ?? rawParams?.search) as string | undefined
  const queryParams = params ? { ...params, query: term, search: term } : params
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<FitmentPositionResponse>>
  >(baseUrl(companyUuid), {
    params: queryParams,
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function getFitmentPosition(
  companyUuid: string,
  fitmentPositionUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<FitmentPositionResponse>
  >(`${baseUrl(companyUuid)}/${fitmentPositionUuid}`, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function createFitmentPosition(
  companyUuid: string,
  input: CreateFitmentPositionRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<
    ApiSuccessResponse<FitmentPositionResponse>
  >(baseUrl(companyUuid), input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function updateFitmentPosition(
  companyUuid: string,
  fitmentPositionUuid: string,
  input: UpdateFitmentPositionRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.put<
    ApiSuccessResponse<FitmentPositionResponse>
  >(`${baseUrl(companyUuid)}/${fitmentPositionUuid}`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function updateFitmentPositionStatus(
  companyUuid: string,
  fitmentPositionUuid: string,
  input: UpdateFitmentPositionStatusRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.patch<
    ApiSuccessResponse<FitmentPositionResponse>
  >(`${baseUrl(companyUuid)}/${fitmentPositionUuid}/status`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

// ── Bulk Import ────────────────────────────────────────────────────────────
// Backend: GET .../fitment-positions/import/template?format=csv|xlsx,
// POST .../fitment-positions/import (multipart `file`).

export async function getFitmentPositionImportTemplate(
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

export async function uploadFitmentPositionImport(
  companyUuid: string,
  file: File
) {
  const resolved = companyHeader(companyUuid)
  const form = new FormData()
  form.append("file", file, file.name)
  const { data } = await apiClient.post<
    ApiSuccessResponse<FitmentPositionImportResponse>
  >(`${baseUrl(companyUuid)}/import`, form, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

// ── Master Data Export ───────────────────────────────────────────────────────

export type ExportFitmentPositionsFilters = {
  search?: string
}

export async function exportFitmentPositions(
  companyUuid: string,
  format: "csv" | "xlsx",
  filters?: ExportFitmentPositionsFilters
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
