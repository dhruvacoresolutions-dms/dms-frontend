export type ProductUomStatus = "ACTIVE" | "INACTIVE"

export type CreateProductUomRequest = {
  code: string
  name: string
  description?: string
}

export type UpdateProductUomRequest = {
  name: string
  description?: string
  version?: number
}

export type UpdateProductUomStatusRequest = {
  status: ProductUomStatus
  version?: number
}

export type ProductUomResponse = {
  uomUuid: string
  code: string
  name: string
  description?: string
  status: ProductUomStatus
  version?: number
  createdAt?: string
  updatedAt?: string
}

export type ProductUomListParams = {
  search?: string
  query?: string
  status?: ProductUomStatus
  page?: number
  size?: number
}

export type ProductUomImportRowError = {
  field?: string
  message?: string
  rowNumber?: number
  reason?: string
} & Record<string, unknown>

export type ProductUomImportResultResponse = {
  totalRows: number
  importedRows: number
  failedRows: number
  rowErrors?: ProductUomImportRowError[]
  status: string
  successRows?: number
  diagnostics?: ProductUomImportRowError[]
} & Record<string, unknown>
