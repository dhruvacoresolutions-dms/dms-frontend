export type DistributorStatus = "ACTIVE" | "INACTIVE"
export type DistributorLoginStatus = "NONE" | "ACTIVE" | "DISABLED"
export type TaxRegistrationStatus = "REGISTERED" | "UNREGISTERED"
export type BranchType =
  | "HEAD_OFFICE"
  | "BRANCH"
  | "WAREHOUSE"
  | "DEPOT"
  | "DEALER"
  | "SERVICE_LOCATION"
export type StorageType = "AMBIENT" | "CHILLED" | "FROZEN" | "MIXED"
export type LicenseType = "DRUG" | "FOOD_TRADE" | "OTHER"
export type BankAccountType = "SAVINGS" | "CURRENT" | "OD" | "CC"

// ── Core distributor ─────────────────────────────────────────────────────────

export type CreateDistributorRequest = {
  distributorCode: string
  distributorName: string
  legalName: string
  distributorTypeUuid: string
  parentDistributorUuid?: string
  businessConstitutionUuid?: string
  effectiveFrom?: string
  primaryContactName: string
  mobileNumber: string
  email?: string
  addressLine1: string
  addressLine2?: string
  postalCode: string
  geographyUuid: string
  geographyType?: string
  taxRegistrationStatus: TaxRegistrationStatus
  pan?: string
  gstin?: string
  taxProfileUuid: string
  paymentTermsUuid?: string
  creditAllowed?: boolean
  creditLimit?: number
  creditDays?: number
  supplierUuid?: string
  sfaEnabled?: boolean
  orderBookingEnabled?: boolean
  collectionEnabled?: boolean
}

export type UpdateDistributorRequest = CreateDistributorRequest & {
  version?: number
}

export type UpdateDistributorStatusRequest = {
  status: DistributorStatus
  version?: number
}

export type DistributorResponse = {
  distributorUuid: string
  distributorCode: string
  distributorName: string
  legalName?: string | null
  distributorTypeUuid?: string | null
  distributorTypeCode?: string | null
  distributorTypeName?: string | null
  parentDistributorUuid?: string | null
  parentDistributorCode?: string | null
  parentDistributorName?: string | null
  businessConstitutionUuid?: string | null
  businessConstitutionCode?: string | null
  businessConstitutionName?: string | null
  effectiveFrom?: string | null
  primaryContactName?: string | null
  mobileNumber?: string | null
  email?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  postalCode?: string | null
  geographyUuid?: string | null
  geographyType?: string | null
  taxRegistrationStatus?: TaxRegistrationStatus | null
  pan?: string | null
  gstin?: string | null
  taxProfileUuid?: string | null
  taxProfileCode?: string | null
  taxProfileName?: string | null
  paymentTermsUuid?: string | null
  paymentTermCode?: string | null
  paymentTermName?: string | null
  creditAllowed?: boolean
  creditLimit?: number | null
  creditDays?: number | null
  supplierUuid?: string | null
  sfaEnabled?: boolean
  orderBookingEnabled?: boolean
  collectionEnabled?: boolean
  status: DistributorStatus
  version?: number
  createdAt?: string
  updatedAt?: string
}

export type DistributorListResponse = DistributorResponse & {
  loginStatus: DistributorLoginStatus
}

export type DistributorListParams = {
  search?: string
  status?: DistributorStatus
  distributorTypeUuid?: string
  loginStatus?: DistributorLoginStatus
  page?: number
  size?: number
}

// ── Branches ─────────────────────────────────────────────────────────────────

export type CreateDistributorBranchRequest = {
  branchCode: string
  branchName: string
  branchType: BranchType
  isPrimary?: boolean
  addressLine1: string
  addressLine2?: string
  geographyUuid: string
  geographyType?: string
  postalCode: string
  contactPerson?: string
  mobileNumber?: string
  email?: string
  latitude?: number
  longitude?: number
  branchGstin?: string
  warehouseEnabled?: boolean
  storageType?: StorageType | null
  coldChainEnabled?: boolean
  serviceFacilityEnabled?: boolean
  effectiveFrom?: string
  effectiveTo?: string
}

export type UpdateDistributorBranchRequest =
  Partial<CreateDistributorBranchRequest> & {
    version?: number
  }

export type UpdateDistributorBranchStatusRequest = {
  status: DistributorStatus
  version?: number
}

export type DistributorBranchResponse = {
  branchUuid: string
  branchCode: string
  branchName: string
  branchType?: BranchType | null
  isPrimary?: boolean
  addressLine1?: string | null
  addressLine2?: string | null
  geographyUuid?: string | null
  geographyType?: string | null
  postalCode?: string | null
  contactPerson?: string | null
  mobileNumber?: string | null
  email?: string | null
  latitude?: number | null
  longitude?: number | null
  branchGstin?: string | null
  warehouseEnabled?: boolean
  storageType?: StorageType | null
  coldChainEnabled?: boolean
  serviceFacilityEnabled?: boolean
  effectiveFrom?: string | null
  effectiveTo?: string | null
  status: DistributorStatus
  isDefault?: boolean
  version?: number
  createdAt?: string
  updatedAt?: string
}

export type DistributorBranchListParams = {
  search?: string
  status?: DistributorStatus
  page?: number
  size?: number
}

// ── Licenses ─────────────────────────────────────────────────────────────────

export type CreateDistributorLicenseRequest = {
  licenseType: LicenseType
  licenseNumber: string
  issuingAuthority?: string
  validFrom: string
  validTo: string
  branchUuid?: string
}

export type UpdateDistributorLicenseRequest =
  CreateDistributorLicenseRequest & {
    version?: number
  }

export type UpdateDistributorLicenseStatusRequest = {
  status: DistributorStatus
  version?: number
}

export type DistributorLicenseResponse = {
  licenseUuid: string
  licenseType: LicenseType
  licenseNumber: string
  issuingAuthority?: string | null
  validFrom?: string | null
  validTo?: string | null
  branchUuid?: string | null
  expired?: boolean
  status: DistributorStatus
  version?: number
  createdAt?: string
  updatedAt?: string
}

export type DistributorLicenseListParams = {
  licenseType?: LicenseType
  status?: DistributorStatus
  expired?: boolean
  branchUuid?: string
  page?: number
  size?: number
}

// ── Bank account ─────────────────────────────────────────────────────────────

export type UpsertDistributorBankRequest = {
  bankName: string
  accountHolderName: string
  accountNumber: string
  ifscCode: string
  branchName?: string
  accountType: BankAccountType
  version?: number
}

export type DistributorBankAccount = {
  bankName?: string | null
  accountHolderName?: string | null
  accountNumber?: string | null
  ifscCode?: string | null
  branchName?: string | null
  accountType?: BankAccountType | null
  version?: number
}

export type DistributorBankResponse = {
  bankAccountRequired?: boolean
  bankAccount?: DistributorBankAccount | null
}

// ── Login ────────────────────────────────────────────────────────────────────

export type DistributorLoginStatusResponse = {
  exists: boolean
  username?: string | null
  status?: string | null
  lastLoginAt?: string | null
}

export type DistributorLoginCredentialsResponse = {
  username?: string
  temporaryPassword?: string
  mustChangePassword?: boolean
  emailDispatched?: boolean
}

export type ChangeDistributorLoginStatusRequest = {
  enabled: boolean
}

export type DistributorLoginStatusChangeResponse = {
  username?: string
  status?: string
  mustChangePassword?: boolean
  temporaryPassword?: string
  emailDispatched?: boolean
}

// ── Bulk import / export ─────────────────────────────────────────────────────

export type DistributorImportRowError = {
  rowNumber?: number
  entityKey?: string
  field?: string
  rejectedValue?: string
  errorCode?: string
  reason?: string
  message?: string
}

export type DistributorImportResultResponse = {
  totalRows: number
  importedRows?: number
  failedRows: number
  rowErrors?: DistributorImportRowError[]
  status: string
  successRows?: number
  diagnostics?: DistributorImportRowError[]
}

export type DistributorImportHistoryItem = {
  jobUuid?: string
  importJobUuid?: string
  status?: string
  totalRows?: number
  successRows?: number
  failedRows?: number
  createdAt?: string
  uploadedByUserUuid?: string
  originalFilename?: string
  attachmentAvailable?: boolean
}

export type DistributorImportHistoryParams = {
  page?: number
  size?: number
}

export type DistributorImportJob = {
  jobUuid?: string
  status?: string
  totalRows?: number
  successRows?: number
  failedRows?: number
  diagnostics?: DistributorImportRowError[]
  originalFilename?: string
  attachmentAvailable?: boolean
}

export type ExportDistributorsFilters = {
  search?: string
  status?: string
  distributorTypeUuid?: string
}

export type BulkDistributorRequest = { distributorUuids: string[] }
export type BulkDistributorResultRow = {
  distributorUuid: string
  distributorCode?: string
  result: "DEACTIVATED" | "SKIPPED" | "FAILED"
  message?: string | null
}
export type BulkDistributorDeactivateResponse = {
  total: number
  successful: number
  skipped: number
  failed: number
  results: BulkDistributorResultRow[]
}
export type BulkDistributorLoginSummary = {
  total?: number
  created?: number
  enabled?: number
  skipped?: number
  failed?: number
}
