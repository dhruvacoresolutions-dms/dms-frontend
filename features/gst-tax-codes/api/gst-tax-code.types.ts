/**
 * V2 GST Tax Code model (collection folder "14 - GST Tax Structures" > "GST
 * Tax Codes"). The legacy `/gst-tax-structures` endpoints were removed by the
 * backend; every GST reference now uses `taxCode`.
 */

export type GstTaxCodeStatus = "ACTIVE" | "INACTIVE"

export type GstCessType = "NONE" | "PERCENTAGE" | "FIXED_AMOUNT" | "BOTH"

/** GST classification of the mapped product (e.g. PARTS, SERVICE). */
export type GstProductType = "PARTS" | "SERVICE" | string

export type GstTaxCodeResponse = {
  taxVersionUuid: string
  taxCode: string
  description: string | null
  taxCategory: string | null
  totalRate: number | null
  cgstRate: number | null
  sgstRate: number | null
  igstRate: number | null
  cessType: GstCessType | null
  cessRate: number | null
  cessAmount: number | null
  cessAmountBasis: string | null
  effectiveFrom: string | null
  effectiveTo: string | null
  status: GstTaxCodeStatus
  /** `V2` for the current model. */
  structureModel?: string | null
  version: number
  createdAt?: string
  updatedAt?: string
} & Record<string, unknown>

export type CreateGstTaxCodeRequest = {
  taxCode: string
  description?: string | null
  totalRate?: number | null
  cgstRate?: number | null
  sgstRate?: number | null
  igstRate?: number | null
  cessType?: GstCessType | null
  cessRate?: number | null
  cessAmount?: number | null
  cessAmountBasis?: string | null
  effectiveFrom: string
  effectiveTo?: string | null
  status?: GstTaxCodeStatus
  /** `null` for the first version; the superseded version otherwise. */
  previousVersion?: number | null
}

export type CreateGstTaxCodeVersionRequest = CreateGstTaxCodeRequest & {
  previousVersion: number
}

/**
 * Partial update of a single version: status, description and effectiveTo are
 * the only fields the backend accepts (rates require a new version).
 */
export type PatchGstTaxCodeVersionRequest = {
  status?: GstTaxCodeStatus
  description?: string | null
  effectiveTo?: string | null
}

export type GstTaxCodeListParams = {
  search?: string
  query?: string
  status?: GstTaxCodeStatus
  page?: number
  size?: number
}

export type GstTaxCodeImportRowError = {
  field?: string
  message?: string
  rowNumber?: number
  reason?: string
} & Record<string, unknown>

export type GstTaxCodeImportResultResponse = {
  totalRows: number
  importedRows: number
  failedRows: number
  rowErrors?: GstTaxCodeImportRowError[]
  status: string
  successRows?: number
  diagnostics?: GstTaxCodeImportRowError[]
} & Record<string, unknown>
