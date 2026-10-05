import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import type {
  RelationshipTypeResponse,
  CreateRelationshipTypeRequest,
  UpdateRelationshipTypeRequest,
  UpdateRelationshipTypeStatusRequest,
  RelationshipTypeListParams,
  RelationshipTypeImportResponse,
} from "./relationship-type.types"
import type { PageResponse } from "@/features/companies/api/company.types"

function resolveCompanyUuid(companyUuid: string): string {
  if (companyUuid !== "current") return companyUuid
  return useAuthStore.getState().session?.user?.companyUuid ?? companyUuid
}

const baseUrl = (companyUuid: string) =>
  `/api/v1/companies/${resolveCompanyUuid(companyUuid)}/relationship-types`

function companyHeader(companyUuid: string): string {
  return resolveCompanyUuid(companyUuid)
}

export async function getRelationshipTypes(
  companyUuid: string,
  params?: RelationshipTypeListParams
) {
  const resolved = companyHeader(companyUuid)
  const rawParams = params as Record<string, unknown> | undefined
  const term = (rawParams?.query ?? rawParams?.search) as string | undefined
  const queryParams = params ? { ...params, query: term, search: term } : params
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<RelationshipTypeResponse>>
  >(baseUrl(companyUuid), {
    params: queryParams,
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function getRelationshipType(
  companyUuid: string,
  relationshipTypeUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<RelationshipTypeResponse>
  >(`${baseUrl(companyUuid)}/${relationshipTypeUuid}`, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function createRelationshipType(
  companyUuid: string,
  input: CreateRelationshipTypeRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<
    ApiSuccessResponse<RelationshipTypeResponse>
  >(baseUrl(companyUuid), input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function updateRelationshipType(
  companyUuid: string,
  relationshipTypeUuid: string,
  input: UpdateRelationshipTypeRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.put<
    ApiSuccessResponse<RelationshipTypeResponse>
  >(`${baseUrl(companyUuid)}/${relationshipTypeUuid}`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function updateRelationshipTypeStatus(
  companyUuid: string,
  relationshipTypeUuid: string,
  input: UpdateRelationshipTypeStatusRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.patch<
    ApiSuccessResponse<RelationshipTypeResponse>
  >(`${baseUrl(companyUuid)}/${relationshipTypeUuid}/status`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

// ── Bulk Import ────────────────────────────────────────────────────────────
// Backend: GET .../relationship-types/import/template?format=csv|xlsx,
// POST .../relationship-types/import (multipart `file`).

export async function getRelationshipTypeImportTemplate(
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

export async function uploadRelationshipTypeImport(
  companyUuid: string,
  file: File
) {
  const resolved = companyHeader(companyUuid)
  const form = new FormData()
  form.append("file", file, file.name)
  const { data } = await apiClient.post<
    ApiSuccessResponse<RelationshipTypeImportResponse>
  >(`${baseUrl(companyUuid)}/import`, form, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

// ── Master Data Export ───────────────────────────────────────────────────────

export type ExportRelationshipTypesFilters = {
  search?: string
}

export async function exportRelationshipTypes(
  companyUuid: string,
  format: "csv" | "xlsx",
  filters?: ExportRelationshipTypesFilters
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
