export type SupplierStatus = "ACTIVE" | "INACTIVE"

export type CreateSupplierRequest = {
  supplierCode: string
  supplierName: string
  gstin?: string
  addressLine: string
  geographyUuid?: string
  postalCode?: string
  phone?: string
  contactPerson?: string
  email?: string
  addressLine2?: string
  addressLine3?: string
  pan: string
}

export type UpdateSupplierRequest = CreateSupplierRequest & {
  version?: number
}

export type UpdateSupplierStatusRequest = {
  status: SupplierStatus
  version?: number
}

export type SupplierResponse = {
  supplierUuid: string
  supplierCode: string
  supplierName: string
  gstin?: string | null
  addressLine?: string | null
  geographyUuid?: string | null
  geographyType?: string | null
  postalCode?: string | null
  phone?: string | null
  contactPerson?: string | null
  email?: string | null
  addressLine2?: string | null
  addressLine3?: string | null
  pan?: string | null
  bankAccount?: unknown
  status: SupplierStatus
  version?: number
  createdAt?: string
  updatedAt?: string
}

export type SupplierListParams = {
  search?: string
  status?: SupplierStatus
  page?: number
  size?: number
}

// ── Bulk import ──────────────────────────────────────────────────────────────

export type SupplierImportRowError = {
  rowNumber?: number
  entityKey?: string
  field?: string
  rejectedValue?: string
  errorCode?: string
  reason?: string
  message?: string
}

export type SupplierImportResultResponse = {
  totalRows: number
  importedRows?: number
  failedRows: number
  rowErrors?: SupplierImportRowError[]
  status: string
  successRows?: number
  diagnostics?: SupplierImportRowError[]
}

// ── Import history / job detail ──────────────────────────────────────────────

export type SupplierImportHistoryItem = {
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

export type SupplierImportHistoryParams = {
  page?: number
  size?: number
}

export type SupplierImportJob = {
  jobUuid?: string
  status?: string
  totalRows?: number
  successRows?: number
  failedRows?: number
  diagnostics?: SupplierImportRowError[]
  originalFilename?: string
  attachmentAvailable?: boolean
}
