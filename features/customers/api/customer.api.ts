import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import type { PageResponse } from "@/features/companies/api/company.types"
import type {
  CustomerBank,
  CustomerClassificationOptions,
  CustomerClassificationSelection,
  CustomerCredit,
  CustomerDuplicateCheck,
  CustomerDuplicateCheckParams,
  CustomerHistoryEntry,
  CustomerKycDocument,
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
  SaveCustomerKycRequest,
  SaveCustomerKycStatusRequest,
  SaveCustomerPincodeMappingRequest,
  UpdateCustomerRequest,
  UpsertCustomerBankRequest,
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

export async function upsertCustomerBank(
  companyUuid: string,
  customerUuid: string,
  input: UpsertCustomerBankRequest
) {
  const { data } = await apiClient.put<ApiSuccessResponse<CustomerBank>>(
    `${customersUrl(companyUuid)}/${customerUuid}/bank`,
    input,
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

export async function getCustomerKycDocuments(
  companyUuid: string,
  customerUuid: string
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<CustomerKycDocument[]>
  >(`${customersUrl(companyUuid)}/${customerUuid}/kyc-documents`, {
    headers: headers(companyUuid),
  })
  return data.data
}

export async function createCustomerKycDocument(
  companyUuid: string,
  customerUuid: string,
  input: SaveCustomerKycRequest
) {
  const { data } = await apiClient.post<
    ApiSuccessResponse<CustomerKycDocument>
  >(`${customersUrl(companyUuid)}/${customerUuid}/kyc-documents`, input, {
    headers: headers(companyUuid),
  })
  return data.data
}

export async function updateCustomerKycDocument(
  companyUuid: string,
  customerUuid: string,
  documentUuid: string,
  input: SaveCustomerKycRequest
) {
  const { data } = await apiClient.put<ApiSuccessResponse<CustomerKycDocument>>(
    `${customersUrl(companyUuid)}/${customerUuid}/kyc-documents/${documentUuid}`,
    input,
    { headers: headers(companyUuid) }
  )
  return data.data
}

export async function deleteCustomerKycDocument(
  companyUuid: string,
  customerUuid: string,
  documentUuid: string,
  version?: number
) {
  await apiClient.delete(
    `${customersUrl(companyUuid)}/${customerUuid}/kyc-documents/${documentUuid}`,
    { params: { version }, headers: headers(companyUuid) }
  )
}

export async function updateCustomerKycStatus(
  companyUuid: string,
  customerUuid: string,
  documentUuid: string,
  input: SaveCustomerKycStatusRequest
) {
  const { data } = await apiClient.patch<
    ApiSuccessResponse<CustomerKycDocument>
  >(
    `${customersUrl(companyUuid)}/${customerUuid}/kyc-documents/${documentUuid}/status`,
    input,
    { headers: headers(companyUuid) }
  )
  return data.data
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
