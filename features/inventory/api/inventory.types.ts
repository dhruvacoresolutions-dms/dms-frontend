/** Shared inventory API types: godowns, stock documents, summaries and imports. */

// ── Godown ───────────────────────────────────────────────────────────────────

export type GodownStatus = "ACTIVE" | "INACTIVE"

export type GodownResponse = {
  uuid: string
  distributorUuid: string
  distributorBranchUuid?: string | null
  distributorBranchCode?: string | null
  branchCode?: string | null
  godownCode: string
  godownName: string
  addressLine1: string
  addressLine2?: string | null
  addressLine3?: string | null
  country?: string | null
  state?: string | null
  city?: string | null
  postalCode: string
  contactNumber: string
  contactPerson: string
  isDefault: boolean
  isSalesman: boolean
  isMain: boolean
  status: GodownStatus
  version: number
}

export type CreateGodownRequest = {
  godownCode?: string | null
  godownName: string
  addressLine1: string
  addressLine2?: string | null
  addressLine3?: string | null
  state: string
  city: string
  postalCode: string
  contactNumber: string
  contactPerson: string
  distributorBranchUuid?: string | null
  isDefault?: boolean
  isSalesman?: boolean
  country?: string
}

export type UpdateGodownRequest = {
  /** Required for company users; distributor admins may omit it (retained). */
  godownCode?: string
  /** Required for company users; distributor admins may omit it (retained). */
  godownName?: string
  addressLine1: string
  addressLine2?: string | null
  addressLine3?: string | null
  state?: string | null
  city?: string | null
  postalCode: string
  contactNumber: string
  contactPerson: string
  distributorBranchUuid?: string | null
  isDefault?: boolean
  isSalesman?: boolean
  version: number
  country?: string
}

export type UpdateGodownStatusRequest = {
  version: number
}

export type GodownListParams = {
  q?: string
  status?: GodownStatus
  isDefault?: boolean
  isSalesman?: boolean
  page?: number
  size?: number
}

// ── Stock documents ──────────────────────────────────────────────────────────

export type StockTypeCode = "S" | "O" | "U" | "P" | "D"
export type StockDirection = "IN" | "OUT"
export type StockDocumentStatus = "PENDING" | "APPROVED" | "REJECTED"
export type StockDocumentSource = "MANUAL" | "IMPORT"
export type StockDocumentKind = "OPENING" | "REGULAR"
export type StockTransactionType =
  | "OPENING_STOCK"
  | "STOCK_IN"
  | "STOCK_OUT"

export type StockDocumentLine = {
  productUuid: string
  productCode?: string | null
  productName?: string | null
  batchCode?: string | null
  stockType?: StockTypeCode | null
  fromType?: StockTypeCode | null
  toType?: StockTypeCode | null
  quantity: number
  reason?: string | null
  /** Saleable/adjustment only — present when the backend can resolve a rate. */
  mrp?: number | null
  purchaseRate?: number | null
  grossValue?: number | null
}

export type StockDocument = {
  uuid: string
  distributorUuid: string
  godownUuid: string
  referenceNo: string
  /** JSON alias of `referenceNo` returned by the backend. */
  referenceNumber?: string | null
  adjustmentDate?: string | null
  transferDate?: string | null
  /** Single date field returned by the backend (adjustment or transfer date). */
  documentDate?: string | null
  direction?: StockDirection | null
  kind?: StockDocumentKind | null
  transactionType?: StockTransactionType | null
  reason?: string | null
  remarks?: string | null
  documentNumber?: string | null
  status: StockDocumentStatus
  source: StockDocumentSource
  importJobId?: string | number | null
  createdBy?: string | null
  approvedBy?: string | null
  approvedAt?: string | null
  approvedRemarks?: string | null
  rejectedBy?: string | null
  rejectedAt?: string | null
  rejectedRemarks?: string | null
  rejectReason?: string | null
  version: number
  lines: StockDocumentLine[]
  /** Branch code the document was raised against. */
  branchCode?: string | null
  godownCode?: string | null
  godownName?: string | null
  totalProducts?: number | null
  totalQuantity?: number | null
}

export type StockDocumentListParams = {
  godown?: string
  status?: StockDocumentStatus
  dateFrom?: string
  dateTo?: string
  search?: string
  page?: number
  size?: number
}

export type StockAdjustmentListParams = StockDocumentListParams & {
  direction?: StockDirection
  transactionType?: StockTransactionType
}

export type StockTransferListParams = StockDocumentListParams

export type CreateStockAdjustmentLine = {
  productUuid: string
  stockType: StockTypeCode
  quantity: number
  /** Optional per-line reason; falls back to the header reason. */
  reason?: string
}

export type CreateStockAdjustmentRequest = {
  godownUuid: string
  adjustmentDate: string
  direction: StockDirection
  transactionType?: StockTransactionType
  reason: string
  remarks?: string
  documentNumber?: string
  lines: CreateStockAdjustmentLine[]
}

export type CreateStockTransferLine = {
  productUuid: string
  fromType: StockTypeCode
  toType: StockTypeCode
  quantity: number
}

export type CreateStockTransferRequest = {
  godownUuid: string
  transferDate: string
  remarks?: string
  documentNumber?: string
  lines: CreateStockTransferLine[]
}

/** `POST /approve`, `/approval` and `/reject` all accept this body. */
export type StockDecisionRequest = {
  version: number
  remarks?: string
}

// ── Lookups ──────────────────────────────────────────────────────────────────

export type StockTypeOption = {
  code: StockTypeCode
  name: string
  displayName: string
}

// ── Stock summary ────────────────────────────────────────────────────────────

export type StockSummaryGroupBy = "batch" | "godown" | "product" | "stockType"

export type StockSummaryRow = {
  godownUuid?: string | null
  productUuid?: string | null
  batchCode?: string | null
  stockType?: StockTypeCode | null
  quantity: number
}

export type StockSummaryParams = {
  godown?: string
  product?: string
  stockType?: StockTypeCode
  batch?: string
  groupBy?: StockSummaryGroupBy
  page?: number
  size?: number
}

export type AvailableQuantityParams = {
  godown: string
  product: string
  stockType: StockTypeCode
  batch?: string
}

export type ScopedProductSearchBy = "ALL" | "NAME" | "CODE" | "MRP"

export type ScopedProduct = {
  productUuid: string
  code: string
  shortName?: string | null
  name: string
  distributorProductCode?: string | null
  mrp?: number | null
}

export type ScopedProductSearchParams = {
  godown: string
  search?: string
  searchBy?: ScopedProductSearchBy
  page?: number
  size?: number
}

// ── Notifications ────────────────────────────────────────────────────────────

export type StockNotificationEvent = "SUBMITTED" | "APPROVED" | "REJECTED"

export type StockNotification = {
  uuid: string
  event: StockNotificationEvent
  referenceNo: string
  adjustmentUuid: string
  message: string
  createdAt: string
  readAt?: string | null
}

export type StockNotificationPage = {
  content: StockNotification[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  unreadCount: number
}

export type StockNotificationListParams = {
  unreadOnly?: boolean
  page?: number
  size?: number
}

// ── Stock adjustment import ──────────────────────────────────────────────────

export type StockImportRowError = {
  rowNumber: number
  field: string
  errorCode: string
  message: string
}

export type StockImportDiagnostic = {
  sheet: string
  rowNumber: number
  entityKey?: string | null
  field: string
  rejectedValue?: string | null
  errorCode: string
  reason: string
}

export type StockImportResult = {
  totalRows: number
  importedRows: number
  failedRows: number
  rowErrors: StockImportRowError[]
  status: "COMPLETED" | "PARTIAL" | "FAILED" | string
  successRows: number
  diagnostics: StockImportDiagnostic[]
}

export type StockImportUploadResponse = {
  jobUuid: string
  result: StockImportResult
}

export type StockImportHistoryItem = {
  jobUuid: string
  importType: string
  status: string
  totalRows: number
  successRows: number
  failedRows: number
  createdAt: string
  uploadedByUserUuid?: string | null
  originalFilename?: string | null
  attachmentAvailable: boolean
}

export type StockImportJobDetail = {
  jobUuid: string
  importType: string
  status: string
  totalRows: number
  successRows: number
  failedRows: number
  diagnostics: StockImportDiagnostic[]
}

export type StockImportHistoryParams = {
  page?: number
  size?: number
}
