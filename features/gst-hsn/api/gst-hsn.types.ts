export type GstHsnStatus = "ACTIVE" | "INACTIVE"

export type CreateGstHsnRequest = {
  hsnCode: string
  description?: string
  effectiveFrom?: string
  effectiveTo?: string | null
  gstProductType?: string
}

export type UpdateGstHsnRequest = {
  description?: string
  effectiveFrom?: string
  effectiveTo?: string | null
  gstProductType?: string
  version?: number | null
}

export type UpdateGstHsnStatusRequest = {
  status: GstHsnStatus
  version?: number | null
}

export type GstHsnResponse = {
  hsnUuid: string
  hsnCode: string
  description: string | null
  effectiveFrom: string | null
  effectiveTo: string | null
  gstProductType: string | null
  status: GstHsnStatus
  version: number
  createdAt: string
  updatedAt: string
}

export type GstHsnListParams = {
  search?: string
  query?: string
  status?: GstHsnStatus
  page?: number
  size?: number
}

export type GstHsnImportResponse = {
  totalRows: number
  importedRows: number
  failedRows: number
  rowErrors?: unknown[]
  status: string
  successRows?: number
  diagnostics?: unknown[]
}
