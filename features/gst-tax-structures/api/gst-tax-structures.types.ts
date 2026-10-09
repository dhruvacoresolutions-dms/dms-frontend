export type GstTaxStructureStatus = "ACTIVE" | "INACTIVE"

export type CreateGstTaxStructureRequest = {
  taxType: string
  taxCode: string
  cgstRate?: number | null
  sgstRate?: number | null
  igstRate?: number | null
  applyOn?: string | null
  cessRate?: number | null
  cessAmount?: number | null
  discountBeforeTax?: boolean | null
  discountAfterTax?: boolean | null
  schemeDiscountEffect?: string | null
  cashDiscountEffect?: string | null
  dbDiscountEffect?: string | null
  effectiveFrom?: string | null
  effectiveTo?: string | null
  version?: number | null
}

export type UpdateGstTaxStructureRequest = {
  taxType?: string
  taxCode?: string
  cgstRate?: number | null
  sgstRate?: number | null
  igstRate?: number | null
  applyOn?: string | null
  cessRate?: number | null
  cessAmount?: number | null
  discountBeforeTax?: boolean | null
  discountAfterTax?: boolean | null
  schemeDiscountEffect?: string | null
  cashDiscountEffect?: string | null
  dbDiscountEffect?: string | null
  effectiveFrom?: string | null
  effectiveTo?: string | null
  version?: number | null
}

export type UpdateGstTaxStructureStatusRequest = {
  status: GstTaxStructureStatus
  version?: number | null
}

export type GstTaxStructureResponse = {
  taxStructureUuid: string
  taxType: string
  taxCode: string
  cgstRate: number | null
  sgstRate: number | null
  igstRate: number | null
  applyOn: string | null
  cessRate: number | null
  cessAmount: number | null
  discountBeforeTax: boolean | null
  discountAfterTax: boolean | null
  schemeDiscountEffect: string | null
  cashDiscountEffect: string | null
  dbDiscountEffect: string | null
  effectiveFrom: string | null
  effectiveTo: string | null
  status: GstTaxStructureStatus
  version: number
  createdAt: string
  updatedAt: string
}

export type GstTaxStructureListParams = {
  search?: string
  query?: string
  status?: GstTaxStructureStatus
  page?: number
  size?: number
}

export type GstTaxStructureImportResponse = {
  totalRows: number
  importedRows: number
  failedRows: number
  rowErrors?: unknown[]
  status: string
  successRows?: number
  diagnostics?: unknown[]
}
