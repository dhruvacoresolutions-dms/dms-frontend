import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import type {
  GstTaxStructureResponse,
  CreateGstTaxStructureRequest,
  UpdateGstTaxStructureRequest,
  UpdateGstTaxStructureStatusRequest,
  GstTaxStructureListParams,
  GstTaxStructureImportResponse,
} from "./gst-tax-structures.types"
import type { PageResponse } from "@/features/companies/api/company.types"

function resolveCompanyUuid(companyUuid: string): string {
  if (companyUuid !== "current") return companyUuid
  return useAuthStore.getState().session?.user?.companyUuid ?? companyUuid
}

const baseUrl = (companyUuid: string) =>
  `/api/v1/companies/${resolveCompanyUuid(companyUuid)}/gst-tax-structures`

function companyHeader(companyUuid: string): string {
  return resolveCompanyUuid(companyUuid)
}

export async function getGstTaxStructures(
  companyUuid: string,
  params?: GstTaxStructureListParams
) {
  const resolved = companyHeader(companyUuid)
  // Send both `query` and `search`: different backend endpoints honor
  // different names, unknown params are ignored.
  const term = params?.query ?? params?.search
  const queryParams = params ? { ...params, query: term, search: term } : params
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<GstTaxStructureResponse>>
  >(baseUrl(companyUuid), {
    params: queryParams,
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function getGstTaxStructure(
  companyUuid: string,
  taxStructureUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<GstTaxStructureResponse>
  >(`${baseUrl(companyUuid)}/${taxStructureUuid}`, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function createGstTaxStructure(
  companyUuid: string,
  input: CreateGstTaxStructureRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<
    ApiSuccessResponse<GstTaxStructureResponse>
  >(baseUrl(companyUuid), input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function updateGstTaxStructure(
  companyUuid: string,
  taxStructureUuid: string,
  input: UpdateGstTaxStructureRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.put<
    ApiSuccessResponse<GstTaxStructureResponse>
  >(`${baseUrl(companyUuid)}/${taxStructureUuid}`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function updateGstTaxStructureStatus(
  companyUuid: string,
  taxStructureUuid: string,
  input: UpdateGstTaxStructureStatusRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.patch<
    ApiSuccessResponse<GstTaxStructureResponse>
  >(`${baseUrl(companyUuid)}/${taxStructureUuid}/status`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

// ── Bulk Import ────────────────────────────────────────────────────────────
// Collection folder "21 - Supporting Master Imports" (singular `/import`):
//   GET  .../gst-tax-structures/import/template?format=csv|xlsx
//   POST .../gst-tax-structures/import (multipart `file`; synchronous result)

export async function getGstTaxStructureImportTemplate(
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

export async function uploadGstTaxStructureImport(
  companyUuid: string,
  file: File
) {
  const resolved = companyHeader(companyUuid)
  const form = new FormData()
  form.append("file", file, file.name)
  const { data } = await apiClient.post<
    ApiSuccessResponse<GstTaxStructureImportResponse>
  >(`${baseUrl(companyUuid)}/import`, form, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

// ── Master Data Export ───────────────────────────────────────────────────────
// No export endpoint exists for GST tax structures in the Postman
// collection. This follows the same convention as the other masters
// (GET {base}/export?format=csv|xlsx) in case the backend supports it.
export type ExportGstTaxStructuresFilters = {
  search?: string
}

export async function exportGstTaxStructures(
  companyUuid: string,
  format: "csv" | "xlsx",
  filters?: ExportGstTaxStructuresFilters
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
