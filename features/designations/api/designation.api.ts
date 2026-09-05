import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import type {
  DesignationResponse,
  CreateDesignationRequest,
  UpdateDesignationRequest,
  UpdateDesignationStatusRequest,
  DesignationListParams,
} from "./designation.types"
import type { PageResponse } from "@/features/companies/api/company.types"

function resolveCompanyUuid(companyUuid: string): string {
  if (companyUuid !== "current") return companyUuid
  return useAuthStore.getState().session?.user?.companyUuid ?? companyUuid
}

const baseUrl = (companyUuid: string) =>
  `/v1/companies/${resolveCompanyUuid(companyUuid)}/designations`

function companyHeader(companyUuid: string): string {
  return resolveCompanyUuid(companyUuid)
}

function normalizeDesignation(
  raw: DesignationResponse & { publicId?: string; designationUuid?: string }
): DesignationResponse {
  const publicId =
    (raw as unknown as { publicId: string }).publicId ??
    raw.designationUuid ??
    ""
  return {
    ...raw,
    publicId,
    designationUuid: raw.designationUuid ?? publicId,
  } as DesignationResponse
}

export async function getDesignations(
  companyUuid: string,
  params?: DesignationListParams
) {
  const resolved = companyHeader(companyUuid)
  const queryParams = params
    ? { ...params, query: params.query ?? params.search }
    : params
  if (queryParams && "search" in queryParams)
    delete (queryParams as Record<string, unknown>).search
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<DesignationResponse>>
  >(baseUrl(companyUuid), {
    params: queryParams,
    headers: { "X-Company-Context": resolved },
  })
  const page = data.data
  return {
    ...page,
    content: page.content.map(normalizeDesignation),
  } as PageResponse<DesignationResponse>
}

export async function getDesignation(
  companyUuid: string,
  designationUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<ApiSuccessResponse<DesignationResponse>>(
    `${baseUrl(companyUuid)}/${designationUuid}`,
    { headers: { "X-Company-Context": resolved } }
  )
  return normalizeDesignation(data.data)
}

export async function createDesignation(
  companyUuid: string,
  input: CreateDesignationRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<
    ApiSuccessResponse<DesignationResponse>
  >(baseUrl(companyUuid), input, { headers: { "X-Company-Context": resolved } })
  return normalizeDesignation(data.data)
}

export async function updateDesignation(
  companyUuid: string,
  designationUuid: string,
  input: UpdateDesignationRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.put<ApiSuccessResponse<DesignationResponse>>(
    `${baseUrl(companyUuid)}/${designationUuid}`,
    input,
    { headers: { "X-Company-Context": resolved } }
  )
  return normalizeDesignation(data.data)
}

export async function updateDesignationStatus(
  companyUuid: string,
  designationUuid: string,
  input: UpdateDesignationStatusRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.patch<
    ApiSuccessResponse<DesignationResponse>
  >(`${baseUrl(companyUuid)}/${designationUuid}/status`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return normalizeDesignation(data.data)
}

// ── Bulk Import ────────────────────────────────────────────────────────────

export async function getDesignationImportTemplate(
  companyUuid: string,
  format?: "csv" | "xlsx"
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<Blob>(
    `${baseUrl(companyUuid)}/imports/template`,
    {
      headers: { "X-Company-Context": resolved },
      params: format ? { format } : undefined,
      responseType: "blob",
    }
  )
  return data
}

export async function uploadDesignationImport(companyUuid: string, file: File) {
  const resolved = companyHeader(companyUuid)
  const form = new FormData()
  form.append("file", file, file.name)
  const { data } = await apiClient.post<
    ApiSuccessResponse<
      { importJobUuid?: string; publicId?: string } & Record<string, unknown>
    >
  >(`${baseUrl(companyUuid)}/imports`, form, {
    headers: {
      "X-Company-Context": resolved,
    },
  })
  return data.data
}
