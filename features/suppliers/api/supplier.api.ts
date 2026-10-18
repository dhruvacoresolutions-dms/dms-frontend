import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import type { PageResponse } from "@/features/companies/api/company.types"
import type {
  SupplierResponse,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  UpdateSupplierStatusRequest,
  SupplierListParams,
  SupplierImportResultResponse,
  SupplierImportHistoryItem,
  SupplierImportHistoryParams,
  SupplierImportJob,
} from "./supplier.types"

function resolveCompanyUuid(companyUuid: string): string {
  if (companyUuid !== "current") return companyUuid
  return useAuthStore.getState().session?.user?.companyUuid ?? companyUuid
}

const baseUrl = (companyUuid: string) =>
  `/api/v1/companies/${resolveCompanyUuid(companyUuid)}/suppliers`

function companyHeader(companyUuid: string): string {
  return resolveCompanyUuid(companyUuid)
}

export async function getSuppliers(
  companyUuid: string,
  params?: SupplierListParams
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<SupplierResponse>>
  >(baseUrl(companyUuid), {
    params,
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function getSupplier(companyUuid: string, supplierUuid: string) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<ApiSuccessResponse<SupplierResponse>>(
    `${baseUrl(companyUuid)}/${supplierUuid}`,
    { headers: { "X-Company-Context": resolved } }
  )
  return data.data
}

export async function createSupplier(
  companyUuid: string,
  input: CreateSupplierRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<ApiSuccessResponse<SupplierResponse>>(
    baseUrl(companyUuid),
    input,
    { headers: { "X-Company-Context": resolved } }
  )
  return data.data
}

export async function updateSupplier(
  companyUuid: string,
  supplierUuid: string,
  input: UpdateSupplierRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.put<ApiSuccessResponse<SupplierResponse>>(
    `${baseUrl(companyUuid)}/${supplierUuid}`,
    input,
    { headers: { "X-Company-Context": resolved } }
  )
  return data.data
}

export async function updateSupplierStatus(
  companyUuid: string,
  supplierUuid: string,
  input: UpdateSupplierStatusRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.patch<ApiSuccessResponse<SupplierResponse>>(
    `${baseUrl(companyUuid)}/${supplierUuid}/status`,
    input,
    { headers: { "X-Company-Context": resolved } }
  )
  return data.data
}

// ── Export ───────────────────────────────────────────────────────────────────

export type ExportSuppliersFilters = {
  search?: string
  status?: string
}

export async function exportSuppliers(
  companyUuid: string,
  format: "csv" | "xlsx",
  filters?: ExportSuppliersFilters
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<Blob>(`${baseUrl(companyUuid)}/export`, {
    headers: { "X-Company-Context": resolved },
    params: {
      format,
      search: filters?.search || undefined,
      status: filters?.status || undefined,
    },
    responseType: "blob",
    timeout: 60_000,
  })
  return data
}

// ── Bulk import ──────────────────────────────────────────────────────────────

export async function getSupplierImportTemplate(
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

export async function uploadSupplierImport(companyUuid: string, file: File) {
  const resolved = companyHeader(companyUuid)
  const form = new FormData()
  form.append("file", file, file.name)
  const { data } = await apiClient.post<
    ApiSuccessResponse<SupplierImportResultResponse>
  >(`${baseUrl(companyUuid)}/import`, form, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

// ── Import history / job detail / downloads ──────────────────────────────────

export async function listSupplierImportHistory(
  companyUuid: string,
  params?: SupplierImportHistoryParams
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<SupplierImportHistoryItem>>
  >(`${baseUrl(companyUuid)}/imports`, {
    headers: { "X-Company-Context": resolved },
    params: {
      page: params?.page ?? 0,
      size: params?.size ?? 10,
    },
  })
  return data.data
}

export async function getSupplierImportJob(
  companyUuid: string,
  jobUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<ApiSuccessResponse<SupplierImportJob>>(
    `${baseUrl(companyUuid)}/imports/${jobUuid}`,
    { headers: { "X-Company-Context": resolved } }
  )
  return data.data
}

export async function downloadSupplierImportResults(
  companyUuid: string,
  jobUuid: string,
  format: "csv" | "xlsx"
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<Blob>(
    `${baseUrl(companyUuid)}/imports/${jobUuid}/results.${format}`,
    {
      headers: { "X-Company-Context": resolved },
      responseType: "blob",
    }
  )
  return data
}

export async function downloadSupplierImportOriginal(
  companyUuid: string,
  jobUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<Blob>(
    `${baseUrl(companyUuid)}/imports/${jobUuid}/original`,
    {
      headers: { "X-Company-Context": resolved },
      responseType: "blob",
    }
  )
  return data
}
