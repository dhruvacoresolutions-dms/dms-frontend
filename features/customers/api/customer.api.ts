import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import type { PageResponse } from "@/features/companies/api/company.types"
import type {
  CustomerBank,
  CustomerBankEntry,
  CustomerBankInput,
  CustomerClassificationOptions,
  CustomerClassificationSelection,
  CustomerCredit,
  CustomerDuplicateCheck,
  CustomerDuplicateCheckParams,
  CustomerEntryAction,
  CustomerEntryKind,
  CustomerHistoryEntry,
  CustomerKycEntry,
  CustomerKycInput,
  CustomerLifecycleAction,
  CustomerLifecycleRequest,
  CustomerListParams,
  CustomerLookupType,
  CustomerLookupTypeOption,
  CustomerMasterKind,
  CustomerMasterListParams,
  CustomerMasterRequest,
  CustomerMasterResponse,
  CustomerMasterStatus,
  CustomerPincodeExportFilters,
  CustomerPincodeListParams,
  CustomerPincodeMapping,
  CustomerPincodeMappingStatus,
  CustomerPincodeRecordStatus,
  CustomerPincodeResolution,
  CustomerRequest,
  CustomerResponse,
  CustomerType,
  CustomerImportDetail,
  CustomerImportResult,
  CustomerImportSummary,
  SaveCustomerPincodeMappingRequest,
  UpdateCustomerRequest,
  UpsertCustomerCreditRequest,
} from "./customer.types"

function resolveCompanyUuid(companyUuid: string): string {
  if (companyUuid !== "current") return companyUuid
  return useAuthStore.getState().session?.user?.companyUuid ?? companyUuid
}

const companyPath = (companyUuid: string) =>
  `/api/v1/companies/${resolveCompanyUuid(companyUuid)}`

const customersUrl = (companyUuid: string) =>
  `${companyPath(companyUuid)}/customers`

const mastersUrl = (companyUuid: string, kind: CustomerMasterKind) =>
  `${companyPath(companyUuid)}/${kind}`

const pincodesUrl = (companyUuid: string) =>
  `${companyPath(companyUuid)}/customer-pincode-mappings`

function headers(companyUuid: string) {
  return { "X-Company-Context": resolveCompanyUuid(companyUuid) }
}

// ── Core customer ────────────────────────────────────────────────────────────

export async function getCustomers(
  companyUuid: string,
  params?: CustomerListParams
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<CustomerResponse>>
  >(customersUrl(companyUuid), { params, headers: headers(companyUuid) })
  return data.data
}

export async function getCustomer(companyUuid: string, customerUuid: string) {
  const { data } = await apiClient.get<ApiSuccessResponse<CustomerResponse>>(
    `${customersUrl(companyUuid)}/${customerUuid}`,
    { headers: headers(companyUuid) }
  )
  return data.data
}

export async function createCustomer(
  companyUuid: string,
  input: CustomerRequest
) {
  const { data } = await apiClient.post<ApiSuccessResponse<CustomerResponse>>(
    customersUrl(companyUuid),
    input,
    { headers: headers(companyUuid) }
  )
  return data.data
}

export async function updateCustomer(
  companyUuid: string,
  customerUuid: string,
  input: UpdateCustomerRequest
) {
  const { data } = await apiClient.put<ApiSuccessResponse<CustomerResponse>>(
    `${customersUrl(companyUuid)}/${customerUuid}`,
    input,
    { headers: headers(companyUuid) }
  )
  return data.data
}

export async function checkCustomerDuplicate(
  companyUuid: string,
  params: CustomerDuplicateCheckParams
) {
  const { data } = await apiClient.get<ApiSuccessResponse<CustomerDuplicateCheck>>(
    `${customersUrl(companyUuid)}/duplicate-check`,
    { params, headers: headers(companyUuid) }
  )
  return data.data
}

// ── Lifecycle ────────────────────────────────────────────────────────────────

export async function applyCustomerLifecycleAction(
  companyUuid: string,
  customerUuid: string,
  action: CustomerLifecycleAction,
  input: CustomerLifecycleRequest
) {
  const { data } = await apiClient.post<ApiSuccessResponse<CustomerResponse>>(
    `${customersUrl(companyUuid)}/${customerUuid}/${action}`,
    input,
    { headers: headers(companyUuid) }
  )
  return data.data
}

export async function getCustomerHistory(
  companyUuid: string,
  customerUuid: string
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<CustomerHistoryEntry[]>
  >(`${customersUrl(companyUuid)}/${customerUuid}/history`, {
    headers: headers(companyUuid),
  })
  return data.data
}

// ── Bank / credit / KYC ──────────────────────────────────────────────────────

export async function getCustomerBank(
  companyUuid: string,
  customerUuid: string
) {
  const { data } = await apiClient.get<ApiSuccessResponse<CustomerBank | null>>(
    `${customersUrl(companyUuid)}/${customerUuid}/bank`,
    { headers: headers(companyUuid) }
  )
  return data.data
}

export async function getCustomerCredit(
  companyUuid: string,
  customerUuid: string
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<CustomerCredit | null>
  >(`${customersUrl(companyUuid)}/${customerUuid}/credit`, {
    headers: headers(companyUuid),
  })
  return data.data
}

export async function upsertCustomerCredit(
  companyUuid: string,
  customerUuid: string,
  input: UpsertCustomerCreditRequest
) {
  const { data } = await apiClient.put<ApiSuccessResponse<CustomerCredit>>(
    `${customersUrl(companyUuid)}/${customerUuid}/credit`,
    input,
    { headers: headers(companyUuid) }
  )
  return data.data
}

// ── KYC / bank entries (reviewable, multipart add) ──────────────────────────
// `PUT …/bank` and every `…/kyc-documents…` route are retired (410).

const entryUrl = (
  companyUuid: string,
  customerUuid: string,
  kind: CustomerEntryKind
) => `${customersUrl(companyUuid)}/${customerUuid}/${kind}`

/** `data` part of a multipart entry add; the API expects a JSON object part. */
function entryForm(input: object, file?: File | null, filePart = "document") {
  const form = new FormData()
  form.append(
    "data",
    new Blob([JSON.stringify(input)], { type: "application/json" })
  )
  if (file) form.append(filePart, file, file.name)
  return form
}

export async function getCustomerKycEntries(
  companyUuid: string,
  customerUuid: string
) {
  const { data } = await apiClient.get<ApiSuccessResponse<CustomerKycEntry[]>>(
    entryUrl(companyUuid, customerUuid, "kyc-entries"),
    { headers: headers(companyUuid) }
  )
  return data.data
}

export async function addCustomerKycEntry(
  companyUuid: string,
  customerUuid: string,
  input: CustomerKycInput,
  document?: File | null
) {
  const { data } = await apiClient.post<ApiSuccessResponse<CustomerKycEntry>>(
    entryUrl(companyUuid, customerUuid, "kyc-entries"),
    entryForm(input, document),
    { headers: headers(companyUuid) }
  )
  return data.data
}

export async function getCustomerBankEntries(
  companyUuid: string,
  customerUuid: string
) {
  const { data } = await apiClient.get<ApiSuccessResponse<CustomerBankEntry[]>>(
    entryUrl(companyUuid, customerUuid, "bank-entries"),
    { headers: headers(companyUuid) }
  )
  return data.data
}

export async function addCustomerBankEntry(
  companyUuid: string,
  customerUuid: string,
  input: CustomerBankInput,
  proof?: File | null
) {
  const { data } = await apiClient.post<ApiSuccessResponse<CustomerBankEntry>>(
    entryUrl(companyUuid, customerUuid, "bank-entries"),
    entryForm(input, proof, "proof"),
    { headers: headers(companyUuid) }
  )
  return data.data
}

/** `reject`/`revoke` require a reason; `verify` takes no body. */
export async function reviewCustomerEntry(
  companyUuid: string,
  customerUuid: string,
  kind: CustomerEntryKind,
  entryUuid: string,
  action: CustomerEntryAction,
  reason?: string
) {
  const { data } = await apiClient.post<
    ApiSuccessResponse<CustomerKycEntry | CustomerBankEntry>
  >(
    `${entryUrl(companyUuid, customerUuid, kind)}/${entryUuid}/${action}`,
    action === "verify" ? undefined : { reason },
    { headers: headers(companyUuid) }
  )
  return data.data
}

/** Raw bytes of a previously uploaded customer file (shop image / document). */
export async function downloadCustomerFile(
  companyUuid: string,
  fileRef: string
) {
  const { data } = await apiClient.get<Blob>(
    `${customersUrl(companyUuid)}/files/${fileRef}`,
    { headers: headers(companyUuid), responseType: "blob" }
  )
  return data
}

// ── Classification masters ───────────────────────────────────────────────────

export async function getCustomerTypes(companyUuid: string) {
  const { data } = await apiClient.get<ApiSuccessResponse<CustomerType[]>>(
    `${companyPath(companyUuid)}/customer-types`,
    { headers: headers(companyUuid) }
  )
  return data.data
}

export async function getCustomerLookupTypes(companyUuid: string) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<CustomerLookupTypeOption[]>
  >(`${companyPath(companyUuid)}/customer-lookups/types`, {
    headers: headers(companyUuid),
  })
  return data.data
}

export async function getCustomerMasters(
  companyUuid: string,
  kind: CustomerMasterKind,
  params?: CustomerMasterListParams
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<CustomerMasterResponse>>
  >(mastersUrl(companyUuid, kind), { params, headers: headers(companyUuid) })
  return data.data
}

export async function createCustomerMaster(
  companyUuid: string,
  kind: CustomerMasterKind,
  input: CustomerMasterRequest
) {
  const { data } = await apiClient.post<
    ApiSuccessResponse<CustomerMasterResponse>
  >(mastersUrl(companyUuid, kind), input, { headers: headers(companyUuid) })
  return data.data
}

export async function updateCustomerMaster(
  companyUuid: string,
  kind: CustomerMasterKind,
  uuid: string,
  input: CustomerMasterRequest
) {
  const { data } = await apiClient.put<
    ApiSuccessResponse<CustomerMasterResponse>
  >(`${mastersUrl(companyUuid, kind)}/${uuid}`, input, {
    headers: headers(companyUuid),
  })
  return data.data
}

export async function updateCustomerMasterStatus(
  companyUuid: string,
  kind: CustomerMasterKind,
  uuid: string,
  input: { status: CustomerMasterStatus; version: number }
) {
  const { data } = await apiClient.patch<
    ApiSuccessResponse<CustomerMasterResponse>
  >(`${mastersUrl(companyUuid, kind)}/${uuid}/status`, input, {
    headers: headers(companyUuid),
  })
  return data.data
}

export async function loadCustomerDefaults(companyUuid: string) {
  const { data } = await apiClient.post<
    ApiSuccessResponse<{ insertedRows: number }>
  >(`${companyPath(companyUuid)}/customer-masters/load-defaults`, undefined, {
    headers: headers(companyUuid),
  })
  return data.data
}

export async function getCustomerClassificationOptions(
  companyUuid: string,
  selection: CustomerClassificationSelection
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<CustomerClassificationOptions>
  >(`${companyPath(companyUuid)}/customer-classification-mappings/allowed-options`, {
    params: {
      customerTypeUuid: selection.customerTypeUuid,
      subTypeUuid: selection.subTypeUuid,
      channelUuid: selection.channelUuid,
      segmentUuids: selection.segmentUuids,
      categoryUuids: selection.categoryUuids,
      classUuid: selection.classUuid,
    },
    headers: headers(companyUuid),
  })
  return data.data
}

/** Convenience: active values of one lookup type (BUSINESS_TYPE, SHOP_SIZE, …). */
export async function getCustomerLookups(
  companyUuid: string,
  lookupType: CustomerLookupType
) {
  return getCustomerMasters(companyUuid, "customer-lookups", {
    lookupType,
    activeOnly: true,
    sort: "displayOrder,asc",
    page: 0,
    size: 100,
  })
}

// ── Pincode mappings ─────────────────────────────────────────────────────────

export async function getCustomerPincodeMappings(
  companyUuid: string,
  params?: CustomerPincodeListParams
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<CustomerPincodeMapping>>
  >(pincodesUrl(companyUuid), { params, headers: headers(companyUuid) })
  return data.data
}

export async function getCustomerPincodeMapping(
  companyUuid: string,
  uuid: string
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<CustomerPincodeMapping>
  >(`${pincodesUrl(companyUuid)}/${uuid}`, { headers: headers(companyUuid) })
  return data.data
}

export async function createCustomerPincodeMapping(
  companyUuid: string,
  input: SaveCustomerPincodeMappingRequest
) {
  const { data } = await apiClient.post<
    ApiSuccessResponse<CustomerPincodeMapping>
  >(pincodesUrl(companyUuid), input, { headers: headers(companyUuid) })
  return data.data
}

export async function updateCustomerPincodeMapping(
  companyUuid: string,
  uuid: string,
  input: SaveCustomerPincodeMappingRequest
) {
  const { data } = await apiClient.put<
    ApiSuccessResponse<CustomerPincodeMapping>
  >(`${pincodesUrl(companyUuid)}/${uuid}`, input, {
    headers: headers(companyUuid),
  })
  return data.data
}

export async function updateCustomerPincodeMappingStatus(
  companyUuid: string,
  uuid: string,
  input: { recordStatus: CustomerPincodeRecordStatus; version: number }
) {
  const { data } = await apiClient.patch<
    ApiSuccessResponse<CustomerPincodeMapping>
  >(`${pincodesUrl(companyUuid)}/${uuid}/status`, input, {
    headers: headers(companyUuid),
  })
  return data.data
}

export async function resolveCustomerPincode(
  companyUuid: string,
  pincode: string
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<CustomerPincodeResolution>
  >(`${pincodesUrl(companyUuid)}/resolve`, {
    params: { pincode },
    headers: headers(companyUuid),
  })
  return data.data
}

export async function exportCustomerPincodeMappings(
  companyUuid: string,
  format: "csv" | "xlsx",
  filters?: CustomerPincodeExportFilters
) {
  const { data } = await apiClient.get<Blob>(`${pincodesUrl(companyUuid)}/export`, {
    headers: headers(companyUuid),
    params: {
      format,
      search: filters?.search || undefined,
      status:
        filters?.status && filters.status !== ("ALL" as CustomerPincodeMappingStatus)
          ? filters.status
          : undefined,
      recordStatus:
        filters?.recordStatus &&
        filters.recordStatus !== ("ALL" as CustomerPincodeRecordStatus)
          ? filters.recordStatus
          : undefined,
    },
    responseType: "blob",
    timeout: 60_000,
  })
  return data
}

export async function getCustomerPincodeImportTemplate(
  companyUuid: string,
  format: "csv" | "xlsx" = "csv"
) {
  const { data } = await apiClient.get<Blob>(
    `${pincodesUrl(companyUuid)}/import/template`,
    {
      headers: headers(companyUuid),
      params: { format },
      responseType: "blob",
    }
  )
  return data
}

export async function uploadCustomerPincodeImport(
  companyUuid: string,
  file: File
) {
  const form = new FormData()
  form.append("file", file, file.name)
  const { data } = await apiClient.post<
    ApiSuccessResponse<CustomerImportResult>
  >(`${pincodesUrl(companyUuid)}/import`, form, {
    headers: headers(companyUuid),
  })
  return data.data
}

export async function listCustomerPincodeImportHistory(
  companyUuid: string,
  params?: { page?: number; size?: number }
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<CustomerImportSummary>>
  >(`${pincodesUrl(companyUuid)}/imports`, {
    headers: headers(companyUuid),
    params: { page: params?.page ?? 0, size: params?.size ?? 10 },
  })
  return data.data
}

export async function getCustomerPincodeImportJob(
  companyUuid: string,
  jobUuid: string
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<CustomerImportDetail>
  >(`${pincodesUrl(companyUuid)}/imports/${jobUuid}`, {
    headers: headers(companyUuid),
  })
  return data.data
}

export async function downloadCustomerPincodeImportResults(
  companyUuid: string,
  jobUuid: string,
  format: "csv" | "xlsx"
) {
  const { data } = await apiClient.get<Blob>(
    `${pincodesUrl(companyUuid)}/imports/${jobUuid}/results.${format}`,
    { headers: headers(companyUuid), responseType: "blob" }
  )
  return data
}

export async function downloadCustomerPincodeImportOriginal(
  companyUuid: string,
  jobUuid: string
) {
  const { data } = await apiClient.get<Blob>(
    `${pincodesUrl(companyUuid)}/imports/${jobUuid}/original`,
    { headers: headers(companyUuid), responseType: "blob" }
  )
  return data
}
