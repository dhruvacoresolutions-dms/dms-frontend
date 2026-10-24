/**
 * Customer master contract (`master-data-service`, `/27 - Customers`).
 *
 * Server-owned fields (`customerCode`, `uuid`, `companyUuid`,
 * `lifecycleStatus`, `geographyStatus`) are never sent on create/update.
 */

export type CustomerLifecycleStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "VERIFIED"
  | "ACTIVE"
  | "REWORK"
  | "REJECTED"
  | "INACTIVE"

export type CustomerSource =
  "ADMIN" | "EMPLOYEE" | "DISTRIBUTOR" | "SELF_REGISTRATION"

export type CustomerGeographyStatus =
  "MAPPED" | "MAPPING_PENDING" | "REVIEW" | "MANUAL"

export type GstRegistrationType = "REGISTERED" | "UNREGISTERED"

export type CustomerStatus = "ACTIVE" | "INACTIVE"

/** Territory path segment (`MasterDataGeographyClient.Ancestor`). */
export type CustomerGeographyPathItem = {
  uuid: string
  type: string
  code: string
}

// ── Core customer ────────────────────────────────────────────────────────────

export type CustomerResponse = {
  uuid: string
  companyUuid: string
  customerCode: string
  customerType: string
  shopName: string
  contactPerson: string
  mobile: string
  alternateMobile?: string | null
  email?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  landmark?: string | null
  city?: string | null
  state?: string | null
  pincode: string
  latitude?: number | null
  longitude?: number | null
  gstin?: string | null
  pan?: string | null
  subTypeUuid?: string | null
  channelUuid?: string | null
  segmentUuid?: string | null
  categoryUuid?: string | null
  classUuid?: string | null
  groupUuid?: string | null
  businessTypeCode?: string | null
  shopSizeCode?: string | null
  monthlyPotentialCode?: string | null
  preferredLanguageCode?: string | null
  source: CustomerSource
  territoryUuid?: string | null
  geographyStatus: CustomerGeographyStatus
  lifecycleStatus: CustomerLifecycleStatus
  createdBy?: string | null
  createdAt?: string | null
  updatedBy?: string | null
  updatedAt?: string | null
  version: number
  /** Resolved labels keyed by field (`customerType`, `subType`, `territory`, …). */
  displayNames?: Record<string, string> | null
  territoryPath?: CustomerGeographyPathItem[] | null
  hasBank: boolean
  hasCredit: boolean
  kycCount: number
  gstRegistrationType: GstRegistrationType
  beatUuid?: string | null
  dateOfBirth?: string | null
  anniversaryDate?: string | null
}

export type CustomerRequest = {
  customerType: string
  shopName: string
  contactPerson: string
  mobile: string
  alternateMobile?: string
  email?: string
  addressLine1?: string
  addressLine2?: string
  landmark?: string
  city?: string
  state?: string
  pincode: string
  latitude?: number
  longitude?: number
  gstin?: string
  pan?: string
  subTypeUuid?: string
  channelUuid?: string
  segmentUuid?: string
  categoryUuid?: string
  classUuid?: string
  groupUuid?: string
  businessTypeCode?: string
  shopSizeCode?: string
  monthlyPotentialCode?: string
  preferredLanguageCode?: string
  source?: CustomerSource
  territoryUuid?: string
  gstRegistrationType?: GstRegistrationType
  dateOfBirth?: string | null
  anniversaryDate?: string | null
}

export type UpdateCustomerRequest = CustomerRequest & {
  version: number
}

export type CustomerListParams = {
  q?: string
  lifecycleStatus?: CustomerLifecycleStatus
  source?: CustomerSource
  customerType?: string
  pincode?: string
  territoryUuid?: string
  geographyStatus?: CustomerGeographyStatus
  territoryAssigned?: boolean
  sort?: string
  page?: number
  size?: number
}

// ── Lifecycle ────────────────────────────────────────────────────────────────

export type CustomerLifecycleAction =
  | "submit"
  | "verify"
  | "approve"
  | "reject"
  | "rework"
  | "deactivate"
  | "activate"

export type CustomerLifecycleRequest = {
  version: number
  reason?: string
}

export type CustomerHistoryEntry = {
  uuid: string
  from: CustomerLifecycleStatus
  to: CustomerLifecycleStatus
  reason?: string | null
  actor?: string | null
  at: string
}

export type CustomerDuplicateCheck = {
  duplicate: boolean
  customerUuid?: string | null
  customerCode?: string | null
  field?: string | null
}

export type CustomerDuplicateCheckParams = {
  mobile?: string
  gstin?: string
  excludeUuid?: string
}

// ── Bank / credit / KYC ──────────────────────────────────────────────────────

/** `accountNumber` is masked by the API and write-only on save. */
export type CustomerBank = {
  accountHolder: string
  bankName: string
  accountNumber: string
  ifsc: string
  branch: string
  upiId?: string | null
  version?: number | null
}

export type UpsertCustomerBankRequest = {
  accountHolder: string
  bankName: string
  accountNumber: string
  ifsc: string
  branch: string
  upiId?: string
  version?: number
}

export type CustomerCredit = {
  creditLimit: number
  creditDays: number
  openingBalance?: number | null
  version?: number | null
}

export type UpsertCustomerCreditRequest = {
  creditLimit: number
  creditDays: number
  openingBalance?: number
  version?: number
}

export type KycDocumentStatus = "PENDING" | "VERIFIED" | "REJECTED"

export type CustomerKycDocument = {
  uuid: string
  kycDocumentTypeCode: string
  documentNumber: string
  remarks?: string | null
  fileRef?: string | null
  status: KycDocumentStatus
}

export type SaveCustomerKycRequest = {
  kycDocumentTypeCode: string
  documentNumber: string
  remarks?: string
  fileRef?: string
  /** Customer row version (KYC mutations lock the customer, not the document). */
  version?: number
}

export type SaveCustomerKycStatusRequest = {
  status: "VERIFIED" | "REJECTED"
  remarks?: string
  version?: number
}

// ── Classification masters ───────────────────────────────────────────────────

export type CustomerMasterKind =
  | "customer-sub-types"
  | "customer-channels"
  | "customer-segments"
  | "customer-categories"
  | "customer-classes"
  | "customer-groups"
  | "customer-classification-mappings"
  | "customer-lookups"

export type CustomerMasterStatus = "ACTIVE" | "INACTIVE"

export type CustomerLookupType =
  | "BUSINESS_TYPE"
  | "KYC_DOCUMENT_TYPE"
  | "WORKSHOP_TYPE"
  | "SHOP_SIZE"
  | "MONTHLY_POTENTIAL"
  | "PREFERRED_LANGUAGE"

export type CustomerType = {
  uuid: string
  code: string
  name: string
}

export type CustomerLookupTypeOption = {
  code: CustomerLookupType
  label: string
}

export type CustomerMasterResponse = {
  uuid: string
  code: string
  name: string
  description?: string | null
  displayOrder: number
  status: CustomerMasterStatus
  effectiveFrom?: string | null
  effectiveTo?: string | null
  customerTypeUuid?: string | null
  parentUuid?: string | null
  rankLevel?: number | null
  subTypeUuid?: string | null
  channelUuid?: string | null
  segmentUuid?: string | null
  categoryUuid?: string | null
  classUuid?: string | null
  createdBy?: string | null
  updatedBy?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  version: number
  lookupType?: CustomerLookupType | null
}

export type CustomerMasterRequest = {
  code: string
  name: string
  description?: string
  displayOrder?: number
  status?: CustomerMasterStatus
  effectiveFrom?: string
  effectiveTo?: string
  customerTypeUuid?: string
  parentUuid?: string
  rankLevel?: number
  subTypeUuid?: string
  channelUuid?: string
  segmentUuid?: string
  categoryUuid?: string
  classUuid?: string
  version?: number
  lookupType?: CustomerLookupType
}

export type CustomerMasterListParams = {
  search?: string
  status?: CustomerMasterStatus
  lookupType?: CustomerLookupType
  activeOnly?: boolean
  sort?: string
  page?: number
  size?: number
}

export type CustomerClassificationOptions = {
  subTypes: CustomerMasterResponse[]
  channels: CustomerMasterResponse[]
  segments: CustomerMasterResponse[]
  categories: CustomerMasterResponse[]
  classes: CustomerMasterResponse[]
}

export type CustomerClassificationSelection = {
  customerTypeUuid: string
  subTypeUuid?: string
  channelUuid?: string
  segmentUuids?: string[]
  categoryUuids?: string[]
  classUuid?: string
}

// ── Pincode → territory mapping ──────────────────────────────────────────────

export type CustomerPincodeMappingStatus =
  "MAPPED" | "MAPPING_PENDING" | "REVIEW"

export type CustomerPincodeRecordStatus = "ACTIVE" | "INACTIVE"

export type CustomerPincodeMapping = {
  uuid: string
  pincode: string
  territoryUuid?: string | null
  status: CustomerPincodeMappingStatus
  notes?: string | null
  recordStatus: CustomerPincodeRecordStatus
  createdBy?: string | null
  updatedBy?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  version: number
}

export type SaveCustomerPincodeMappingRequest = {
  pincode: string
  territoryUuid?: string
  status: CustomerPincodeMappingStatus
  notes?: string
  recordStatus?: CustomerPincodeRecordStatus
  version?: number
}

export type CustomerPincodeStatusRequest = {
  recordStatus: CustomerPincodeRecordStatus
  version: number
}

export type CustomerPincodeResolutionStatus =
  "MAPPED" | "NOT_CONFIGURED" | "MAPPING_PENDING" | "REVIEW"

export type CustomerPincodeResolution = {
  pincode: string
  status: CustomerPincodeResolutionStatus
  territoryUuid?: string | null
  geographyPath?: CustomerGeographyPathItem[] | null
}

export type CustomerPincodeListParams = {
  search?: string
  status?: CustomerPincodeMappingStatus
  recordStatus?: CustomerPincodeRecordStatus
  sort?: string
  page?: number
  size?: number
}

// ── Bulk import / export ─────────────────────────────────────────────────────

export type CustomerImportDiagnostic = {
  sheet?: string
  rowNumber?: number
  entityKey?: string
  field?: string
  rejectedValue?: string
  errorCode?: string
  reason?: string
  message?: string
}

export type CustomerImportResult = {
  totalRows: number
  importedRows?: number
  successRows?: number
  failedRows: number
  status: string
  rowErrors?: CustomerImportDiagnostic[]
  diagnostics?: CustomerImportDiagnostic[]
}

export type CustomerImportSummary = {
  jobUuid: string
  importType?: string
  status: string
  totalRows: number
  successRows: number
  failedRows: number
  createdAt?: string
  uploadedByUserUuid?: string
  originalFilename?: string
  attachmentAvailable?: boolean
}

export type CustomerImportDetail = {
  jobUuid: string
  importType?: string
  status: string
  totalRows: number
  successRows: number
  failedRows: number
  diagnostics?: CustomerImportDiagnostic[]
}

export type CustomerPincodeExportFilters = {
  search?: string
  status?: CustomerPincodeMappingStatus
  recordStatus?: CustomerPincodeRecordStatus
}
