export type ProductBrandStatus = "ACTIVE" | "INACTIVE"

export type CreateProductBrandRequest = {
  code: string
  name: string
  description?: string
}

export type UpdateProductBrandRequest = {
  name: string
  description?: string
  version?: number
}

export type UpdateProductBrandStatusRequest = {
  status: ProductBrandStatus
  version?: number
}

export type ProductBrandResponse = {
  brandUuid: string
  code: string
  name: string
  description?: string
  status: ProductBrandStatus
  version?: number
  createdAt?: string
  updatedAt?: string
}

export type ProductBrandListParams = {
  search?: string
  query?: string
  status?: ProductBrandStatus
  page?: number
  size?: number
}

export type ProductBrandImportRowError = {
  field?: string
  message?: string
  rowNumber?: number
  reason?: string
} & Record<string, unknown>

export type ProductBrandImportResultResponse = {
  totalRows: number
  importedRows: number
  failedRows: number
  rowErrors?: ProductBrandImportRowError[]
  status: string
  successRows?: number
  diagnostics?: ProductBrandImportRowError[]
} & Record<string, unknown>
