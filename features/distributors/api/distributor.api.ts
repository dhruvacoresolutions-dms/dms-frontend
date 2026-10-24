import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import type { PageResponse } from "@/features/companies/api/company.types"
import type {
  DistributorResponse,
  DistributorListResponse,
  CreateDistributorRequest,
  UpdateDistributorRequest,
  UpdateDistributorStatusRequest,
  DistributorListParams,
  DistributorBranchResponse,
  CreateDistributorBranchRequest,
  UpdateDistributorBranchRequest,
  UpdateDistributorBranchStatusRequest,
  DistributorBranchListParams,
  DistributorLicenseResponse,
  CreateDistributorLicenseRequest,
  UpdateDistributorLicenseRequest,
  UpdateDistributorLicenseStatusRequest,
  DistributorLicenseListParams,
  DistributorBankResponse,
  UpsertDistributorBankRequest,
  DistributorLoginStatusResponse,
  DistributorLoginCredentialsResponse,
  ChangeDistributorLoginStatusRequest,
  DistributorLoginStatusChangeResponse,
  DistributorImportResultResponse,
  DistributorImportHistoryItem,
  DistributorImportHistoryParams,
  DistributorImportJob,
  ExportDistributorsFilters,
  BulkDistributorRequest,
  BulkDistributorDeactivateResponse,
  BulkDistributorLoginSummary,
} from "./distributor.types"

function resolveCompanyUuid(companyUuid: string): string {
  if (companyUuid !== "current") return companyUuid
  return useAuthStore.getState().session?.user?.companyUuid ?? companyUuid
}

const baseUrl = (companyUuid: string) =>
  `/api/v1/companies/${resolveCompanyUuid(companyUuid)}/distributors`

function companyHeader(companyUuid: string): string {
  return resolveCompanyUuid(companyUuid)
}

// ── Core distributor ─────────────────────────────────────────────────────────

export async function getDistributors(
  companyUuid: string,
  params?: DistributorListParams
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<DistributorListResponse>>
  >(baseUrl(companyUuid), {
    params,
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function getDistributor(
  companyUuid: string,
  distributorUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<ApiSuccessResponse<DistributorResponse>>(
    `${baseUrl(companyUuid)}/${distributorUuid}`,
    { headers: { "X-Company-Context": resolved } }
  )
  return data.data
}

export async function createDistributor(
  companyUuid: string,
  input: CreateDistributorRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<
    ApiSuccessResponse<DistributorResponse>
  >(baseUrl(companyUuid), input, { headers: { "X-Company-Context": resolved } })
  return data.data
}

export async function updateDistributor(
  companyUuid: string,
  distributorUuid: string,
  input: UpdateDistributorRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.put<ApiSuccessResponse<DistributorResponse>>(
    `${baseUrl(companyUuid)}/${distributorUuid}`,
    input,
    { headers: { "X-Company-Context": resolved } }
  )
  return data.data
}

export async function updateDistributorStatus(
  companyUuid: string,
  distributorUuid: string,
  input: UpdateDistributorStatusRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.patch<
    ApiSuccessResponse<DistributorResponse>
  >(`${baseUrl(companyUuid)}/${distributorUuid}/status`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function bulkDeactivateDistributors(
  companyUuid: string,
  input: BulkDistributorRequest
) {
  const { data } = await apiClient.post<
    ApiSuccessResponse<BulkDistributorDeactivateResponse>
  >(`${baseUrl(companyUuid)}/bulk-deactivate`, input, {
    headers: { "X-Company-Context": companyHeader(companyUuid) },
  })
  return data.data
}

export async function bulkLoginDistributors(
  companyUuid: string,
  input: BulkDistributorRequest
): Promise<BulkDistributorLoginSummary> {
  let response
  try {
    response = await apiClient.post<Blob>(
      `${baseUrl(companyUuid)}/bulk-login`,
      input,
      {
        responseType: "blob",
        headers: {
          "X-Company-Context": companyHeader(companyUuid),
          Accept:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/json",
        },
      }
    )
  } catch (error) {
    const responseData = (
      error as { response?: { data?: unknown; status?: number } }
    )?.response
    const blob = responseData?.data
    if (
      typeof Blob !== "undefined" &&
      blob instanceof Blob &&
      String(blob.type).includes("json")
    ) {
      try {
        const parsed = JSON.parse(await blob.text()) as {
          message?: string
          code?: string
          errors?: unknown[]
        }
        throw Object.assign(
          new Error(parsed.message ?? "Bulk login request failed"),
          { response: { status: responseData?.status, data: parsed } }
        )
      } catch (parseError) {
        if (parseError instanceof Error && "response" in parseError)
          throw parseError
      }
    }
    throw error
  }
  const contentType = String(
    response.headers["content-type"] ?? ""
  ).toLowerCase()
  const payload = response.data
  if (contentType.includes("json")) {
    const text = await payload.text()
    let json: unknown
    try {
      json = JSON.parse(text)
    } catch {
      throw new Error("The server returned an unreadable error response")
    }
    throw Object.assign(
      new Error(
        (json as { message?: string })?.message ?? "Bulk login request failed"
      ),
      { response: { status: response.status, data: json } }
    )
  }
  if (
    response.status !== 200 ||
    !contentType.includes(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) ||
    payload.size < 4
  ) {
    throw new Error("The server response was not a valid XLSX download")
  }
  const signature = new Uint8Array(await payload.slice(0, 4).arrayBuffer())
  if (signature[0] !== 0x50 || signature[1] !== 0x4b) {
    throw new Error("The downloaded file is not a valid XLSX workbook")
  }
  const readCount = (name: string) => {
    const raw = response.headers[name]
    if (raw == null || raw === "") return undefined
    const value = Number(raw)
    return Number.isFinite(value) ? value : undefined
  }
  const summary: BulkDistributorLoginSummary = {
    total: readCount("x-bulk-total"),
    created: readCount("x-bulk-created"),
    enabled: readCount("x-bulk-enabled"),
    skipped: readCount("x-bulk-skipped"),
    failed: readCount("x-bulk-failed"),
  }
  const url = URL.createObjectURL(payload)
  try {
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "bulk-distributor-logins.xlsx"
    anchor.rel = "noopener"
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return summary
}

// ── Branches ─────────────────────────────────────────────────────────────────

const branchesUrl = (companyUuid: string, distributorUuid: string) =>
  `${baseUrl(companyUuid)}/${distributorUuid}/branches`

export async function getDistributorBranches(
  companyUuid: string,
  distributorUuid: string,
  params?: DistributorBranchListParams
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<DistributorBranchResponse>>
  >(branchesUrl(companyUuid, distributorUuid), {
    params,
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function createDistributorBranch(
  companyUuid: string,
  distributorUuid: string,
  input: CreateDistributorBranchRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<
    ApiSuccessResponse<DistributorBranchResponse>
  >(branchesUrl(companyUuid, distributorUuid), input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function updateDistributorBranch(
  companyUuid: string,
  distributorUuid: string,
  branchUuid: string,
  input: UpdateDistributorBranchRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.put<
    ApiSuccessResponse<DistributorBranchResponse>
  >(`${branchesUrl(companyUuid, distributorUuid)}/${branchUuid}`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function updateDistributorBranchStatus(
  companyUuid: string,
  distributorUuid: string,
  branchUuid: string,
  input: UpdateDistributorBranchStatusRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.patch<
    ApiSuccessResponse<DistributorBranchResponse>
  >(
    `${branchesUrl(companyUuid, distributorUuid)}/${branchUuid}/status`,
    input,
    {
      headers: { "X-Company-Context": resolved },
    }
  )
  return data.data
}

export async function setPrimaryDistributorBranch(
  companyUuid: string,
  distributorUuid: string,
  branchUuid: string,
  version?: number
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.patch<
    ApiSuccessResponse<DistributorBranchResponse>
  >(
    `${branchesUrl(companyUuid, distributorUuid)}/${branchUuid}/primary`,
    { version },
    { headers: { "X-Company-Context": resolved } }
  )
  return data.data
}

// ── Licenses ─────────────────────────────────────────────────────────────────

const licensesUrl = (companyUuid: string, distributorUuid: string) =>
  `${baseUrl(companyUuid)}/${distributorUuid}/licenses`

export async function getDistributorLicenses(
  companyUuid: string,
  distributorUuid: string,
  params?: DistributorLicenseListParams
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<DistributorLicenseResponse>>
  >(licensesUrl(companyUuid, distributorUuid), {
    params,
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function createDistributorLicense(
  companyUuid: string,
  distributorUuid: string,
  input: CreateDistributorLicenseRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<
    ApiSuccessResponse<DistributorLicenseResponse>
  >(licensesUrl(companyUuid, distributorUuid), input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function updateDistributorLicense(
  companyUuid: string,
  distributorUuid: string,
  licenseUuid: string,
  input: UpdateDistributorLicenseRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.put<
    ApiSuccessResponse<DistributorLicenseResponse>
  >(`${licensesUrl(companyUuid, distributorUuid)}/${licenseUuid}`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function updateDistributorLicenseStatus(
  companyUuid: string,
  distributorUuid: string,
  licenseUuid: string,
  input: UpdateDistributorLicenseStatusRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.patch<
    ApiSuccessResponse<DistributorLicenseResponse>
  >(
    `${licensesUrl(companyUuid, distributorUuid)}/${licenseUuid}/status`,
    input,
    { headers: { "X-Company-Context": resolved } }
  )
  return data.data
}

// ── Bank account ─────────────────────────────────────────────────────────────

export async function getDistributorBankAccount(
  companyUuid: string,
  distributorUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<DistributorBankResponse>
  >(`${baseUrl(companyUuid)}/${distributorUuid}/bank-account`, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function upsertDistributorBankAccount(
  companyUuid: string,
  distributorUuid: string,
  input: UpsertDistributorBankRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.put<
    ApiSuccessResponse<DistributorBankResponse>
  >(`${baseUrl(companyUuid)}/${distributorUuid}/bank-account`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

// ── Login ────────────────────────────────────────────────────────────────────

const loginUrl = (companyUuid: string, distributorUuid: string) =>
  `${baseUrl(companyUuid)}/${distributorUuid}/login`

export async function getDistributorLoginStatus(
  companyUuid: string,
  distributorUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<DistributorLoginStatusResponse>
  >(loginUrl(companyUuid, distributorUuid), {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function createDistributorLogin(
  companyUuid: string,
  distributorUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<
    ApiSuccessResponse<DistributorLoginCredentialsResponse>
  >(loginUrl(companyUuid, distributorUuid), undefined, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function changeDistributorLoginStatus(
  companyUuid: string,
  distributorUuid: string,
  input: ChangeDistributorLoginStatusRequest
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.patch<
    ApiSuccessResponse<DistributorLoginStatusChangeResponse>
  >(`${loginUrl(companyUuid, distributorUuid)}/status`, input, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function resetDistributorLoginPassword(
  companyUuid: string,
  distributorUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.post<
    ApiSuccessResponse<DistributorLoginCredentialsResponse>
  >(`${loginUrl(companyUuid, distributorUuid)}/reset-password`, undefined, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

// ── Export ───────────────────────────────────────────────────────────────────

export async function exportDistributors(
  companyUuid: string,
  format: "csv" | "xlsx",
  filters?: ExportDistributorsFilters
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<Blob>(`${baseUrl(companyUuid)}/export`, {
    headers: { "X-Company-Context": resolved },
    params: {
      format,
      search: filters?.search || undefined,
      status: filters?.status || undefined,
      distributorTypeUuid: filters?.distributorTypeUuid || undefined,
    },
    responseType: "blob",
    timeout: 60_000,
  })
  return data
}

// ── Bulk import ──────────────────────────────────────────────────────────────

export async function getDistributorImportTemplate(
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

export async function uploadDistributorImport(companyUuid: string, file: File) {
  const resolved = companyHeader(companyUuid)
  const form = new FormData()
  form.append("file", file, file.name)
  const { data } = await apiClient.post<
    ApiSuccessResponse<DistributorImportResultResponse>
  >(`${baseUrl(companyUuid)}/import`, form, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

// ── Import history / job detail / downloads ──────────────────────────────────

export async function listDistributorImportHistory(
  companyUuid: string,
  params?: DistributorImportHistoryParams
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<DistributorImportHistoryItem>>
  >(`${baseUrl(companyUuid)}/imports`, {
    headers: { "X-Company-Context": resolved },
    params: { page: params?.page ?? 0, size: params?.size ?? 10 },
  })
  return data.data
}

export async function getDistributorImportJob(
  companyUuid: string,
  jobUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<DistributorImportJob>
  >(`${baseUrl(companyUuid)}/imports/${jobUuid}`, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

export async function downloadDistributorImportResults(
  companyUuid: string,
  jobUuid: string,
  format: "csv" | "xlsx"
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<Blob>(
    `${baseUrl(companyUuid)}/imports/${jobUuid}/results.${format}`,
    { headers: { "X-Company-Context": resolved }, responseType: "blob" }
  )
  return data
}

export async function downloadDistributorImportOriginal(
  companyUuid: string,
  jobUuid: string
) {
  const resolved = companyHeader(companyUuid)
  const { data } = await apiClient.get<Blob>(
    `${baseUrl(companyUuid)}/imports/${jobUuid}/original`,
    { headers: { "X-Company-Context": resolved }, responseType: "blob" }
  )
  return data
}
