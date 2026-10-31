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
  | "ADMIN"
  | "EMPLOYEE"
  | "DISTRIBUTOR"
  | "SELF_REGISTRATION"
  | "LOYALTY"

export type CustomerGeographyStatus =
  "MAPPED" | "MAPPING_PENDING" | "REVIEW" | "MANUAL"

/** `CustomerModels.GeographyResolution` — read-only server resolution state. */
export type CustomerGeographyResolution = "RESOLVED" | "PARTIAL" | "UNRESOLVED"

/** `CustomerModels.PincodeMappingStatus` — read-only server resolution state. */
export type CustomerGeographyPincodeStatus = "CONFIRMED" | "NONE" | "PENDING"

export type GstRegistrationType = "REGISTERED" | "UNREGISTERED"

/** Required for REGISTERED customers, forbidden for UNREGISTERED ones. */
export type GstCategory = "REGULAR" | "COMPOSITION" | "BOTH"

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
  whatsappNumber?: string | null
  whatsappSameAsMobile?: boolean | null
  addressLine1?: string | null
  addressLine2?: string | null
  addressLine3?: string | null
  landmark?: string | null
  city?: string | null
  state?: string | null
  pincode: string
  latitude?: number | null
  longitude?: number | null
  gstRegistrationType: GstRegistrationType
  /** Current column. Clients written before the rename read `gstin`. */
  gstNumber?: string | null
  gstin?: string | null
  gstCategory?: GstCategory | null
  pan?: string | null
  subTypeUuid?: string | null
  channelUuid?: string | null
  segmentUuid?: string | null
  categoryUuid?: string | null
  classUuid?: string | null
  groupUuid?: string | null
  businessTypeCode?: string | null
  /** Numeric, required on create. `shopSizeCode` no longer exists. */
  shopSizeSqFt?: number | null
  /** Numeric (rupees), required on create. `monthlyPotentialCode` no longer exists. */
  monthlyPotential?: number | null
  preferredLanguageCode?: string | null
  source: CustomerSource
  territoryUuid?: string | null
  beatUuid?: string | null
  geographyStatus: CustomerGeographyStatus
  geographyResolution?: CustomerGeographyResolution | null
  pincodeMappingStatus?: CustomerGeographyPincodeStatus | null
  regionUuid?: string | null
  stateUuid?: string | null
  lifecycleStatus: CustomerLifecycleStatus
  createdBy?: string | null
  createdAt?: string | null
  createdByManager?: string | null
  updatedBy?: string | null
  updatedAt?: string | null
  version: number
  /** Resolved labels keyed by field (`customerType`, `subType`, `territory`, …). */
  displayNames?: Record<string, string> | null
  territoryPath?: CustomerGeographyPathItem[] | null
  hasBank: boolean
  /** True after create, because `credit` is mandatory on create. */
  hasCredit: boolean
  kycCount: number
  kycBankComplete?: boolean
  /** First bank entry (PENDING/VERIFIED first). Read entries for `accountType`. */
  bank?: CustomerBank | null
  /** Always present; empty array when the customer has none. */
  kycEntries: CustomerKycEntry[]
  /** Always present; empty array when the customer has none. */
  bankEntries: CustomerBankEntry[]
  /** UUID array on JSON routes, object array on with-files routes. */
  attachments?: string[] | CustomerAttachment[]
  shopImageFileRef?: string | null
  registrationNumber?: string | null
  establishedYear?: number | null
  brandsStocked?: string[] | null
  shopTimings?: { openTime: string; closeTime: string } | null
  dateOfBirth?: string | null
  anniversaryDate?: string | null
  workshopType?: string | null
  experienceYears?: number | null
  engineSpecialty?: string | null
  mechanicCount?: number | null
}

/**
 * `CustomerModels.Request`.
 *
 * Server-owned fields (`customerCode`, `uuid`, `companyUuid`, `lifecycleStatus`,
 * `geographyStatus`, `geographyResolution`, `pincodeMappingStatus`,
 * `regionUuid`, `stateUuid`, `preferredLanguage*`, `groupUuid`) are ignored if
 * sent and are therefore not part of this type.
 */
export type CustomerRequest = {
  customerType: string
  shopName: string
  contactPerson: string
  mobile: string
  alternateMobile?: string
  email: string
  addressLine1: string
  addressLine2?: string
  addressLine3?: string
  landmark?: string
  /** Required — also used with `state` when the pincode has no mapping. */
  city: string
  /** Required — also used with `city` when the pincode has no mapping. */
  state: string
  pincode: string
  latitude?: number
  longitude?: number
  gstRegistrationType: GstRegistrationType
  /** Required + 15-char pattern for REGISTERED; must be absent for UNREGISTERED. */
  gstNumber?: string
  /** Required for REGISTERED; must be absent for UNREGISTERED. */
  gstCategory?: GstCategory
  pan?: string
  subTypeUuid?: string
  channelUuid?: string
  segmentUuid?: string
  categoryUuid?: string
  classUuid?: string
  businessTypeCode: string
  /** Required JSON integer, 0…10,000,000. */
  shopSizeSqFt: number
  /** Required JSON integer, 0…9,999,999,999. */
  monthlyPotential: number
  whatsappNumber: string
  whatsappSameAsMobile?: boolean
  registrationNumber?: string
  establishedYear: number
  brandsStocked?: string[]
  shopTimings: { openTime: string; closeTime: string }
  source?: CustomerSource
  territoryUuid?: string
  beatUuid?: string
  shopImageFileRef?: string
  /** Max 8 document UUIDs; not allowed on with-files routes. */
  attachments?: string[]
  dateOfBirth?: string | null
  anniversaryDate?: string | null
  workshopType?: string
  experienceYears?: number
  engineSpecialty?: string
  mechanicCount?: number
  /** Required on create (`creditLimit` ≥ 0, `creditDays` 0–365). */
  credit: CustomerCreditInput
  /** Create only — ignored by update; use the bank-entry routes afterwards. */
  bank?: CustomerBankInput
  /** Create only — ignored by update; use the KYC-entry routes afterwards. */
  kyc?: CustomerKycInput[]
}

/**
 * `PUT …/customers/{uuid}` ignores `credit`, `bank` and `kyc` (they are
 * stripped server-side), so update payloads must not rely on them.
 */
export type UpdateCustomerRequest = Omit<
  CustomerRequest,
  "credit" | "bank" | "kyc" | "attachments" | "shopImageFileRef"
> & {
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

/**
 * `GET …/customers?pendingMyApproval=true` query. The server forces
 * `SUBMITTED`, sorts by `createdAt,desc` and scopes the result to the caller's
 * reporting users (admins see every company customer). `status` is accepted but
 * ignored, so it is not exposed here.
 */
export type CustomerApprovalQueueParams = {
  q?: string
  page?: number
  size?: number
}

// ── Lifecycle ────────────────────────────────────────────────────────────────

/**
 * Legal lifecycle actions. `approve` is the only path from SUBMITTED to ACTIVE
 * (`…/approve`); the retired `verify` action is not exposed by the API.
 * `VERIFIED` only survives on legacy rows and is approved like SUBMITTED.
 */
export type CustomerLifecycleAction =
  | "submit"
  | "approve"
  | "reject"
  | "rework"
  | "deactivate"
  | "activate"

export type CustomerLifecycleRequest = {
  version: number
  reason?: string
  /**
   * Approve only. Required when the customer has no territory yet — the API
   * answers 400 on `territoryUuid` otherwise.
   */
  territoryUuid?: string
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

/** KYC document types accepted by `/kyc-entries` and create's `kyc[]`. */
export type CustomerKycDocType =
  | "AADHAAR"
  | "PAN"
  | "DRIVING_LICENCE"
  | "VOTER_ID"
  | "PASSPORT"

/** Entry review lifecycle (`PENDING → VERIFIED`, `PENDING → REJECTED`, `VERIFIED → REVOKED`). */
export type CustomerEntryStatus = "PENDING" | "VERIFIED" | "REJECTED" | "REVOKED"

export type CustomerEntryKind = "kyc-entries" | "bank-entries"

export type CustomerEntryAction = "verify" | "reject" | "revoke"

/** Verification columns unwrapped at the top level of every entry response. */
export type CustomerEntryVerification = {
  status: CustomerEntryStatus
  verificationMode: string
  documentFileUuid?: string | null
  createdBy?: string | null
  createdAt?: string | null
  verifiedBy?: string | null
  verifiedAt?: string | null
  rejectedBy?: string | null
  rejectedAt?: string | null
  rejectedReason?: string | null
  revokedBy?: string | null
  revokedAt?: string | null
  revokeReason?: string | null
}

/** `GET …/kyc-entries` item. Numbers are always masked. */
export type CustomerKycEntry = CustomerEntryVerification & {
  uuid: string
  docType: CustomerKycDocType
  numberMasked: string
  /** Null on rows created before the holder-name requirement. */
  holderFirstName?: string | null
  holderLastName?: string | null
  /**
   * Third-party verification id supplied when the entry was added (trimmed,
   * blank → null). Always serialised; null when none was sent and on legacy
   * entries. Stored only in MANUAL mode — the entry still needs a reviewer.
   */
  verificationRef?: string | null
}

/** `GET …/bank-entries` item. `accountMasked` is `X…X` + last 4 digits. */
export type CustomerBankEntry = CustomerEntryVerification & {
  uuid: string
  holderName: string
  bankName: string
  ifsc: string
  branch?: string | null
  accountMasked: string
  accountType?: string | null
  proofFileUuid?: string | null
}

/** Serialized form of the first bank entry returned inside `CustomerResponse`. */
export type CustomerBank = {
  accountHolder: string
  bankName: string
  /** Masked (`X…X` + last 4). */
  accountNumber: string
  ifsc: string
  branch?: string | null
  upiId?: string | null
  /** Always null on the summary — read `bankEntries[]` for the type. */
  accountType?: string | null
  version?: number | null
}

/** `CustomerEntryModels.KycInput` — holder names are required on every create path. */
export type CustomerKycInput = {
  docType: CustomerKycDocType
  number: string
  holderFirstName: string
  holderLastName: string
  /**
   * Optional third-party verification id (≤100 letters, digits, `_ - : .`).
   * Trimmed; blank becomes null. In MANUAL mode it is only stored and the entry
   * stays PENDING.
   */
  verificationRef?: string
  /** with-files only: must reference an uploaded/attached document. */
  documentClientRef?: string
}

/** `CustomerLifecycleModels.Bank` / `CustomerEntryModels.BankInput`. */
export type CustomerBankInput = {
  accountHolder: string
  bankName: string
  /** 9–18 digits. Write-only; responses always mask it. */
  accountNumber: string
  ifsc: string
  branch?: string
  /** Optional, ≤30 chars, letters/spaces/underscores only. */
  accountType?: string
  /**
   * Optional. JSON create only: must be an `attachments` fileRef whose stored
   * document type is `BANK_PROOF`. On with-files it must match the `clientRef`
   * of a `documents[]` entry with `documentType: "BANK_PROOF"`.
   */
  proofClientRef?: string
}

/** `CustomerLifecycleModels.Credit` — required on create only. */
export type CustomerCreditInput = {
  creditLimit: number
  creditDays: number
  openingBalance?: number
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

/** With-files response attachment (JSON routes return plain fileRef UUIDs). */
export type CustomerAttachment = {
  fileRef: string
  fileName: string
  contentType: string
  size: number
  documentType: string
  documentTypeOther?: string | null
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
  | "BANK_NAME"
  | "ACCOUNT_TYPE"

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
