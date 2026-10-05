export type ProductCategoryStatus = "ACTIVE" | "INACTIVE"

export type CreateProductCategoryRequest = {
  code: string
  name: string
  parentCategoryUuid?: string | null
  description?: string
}

export type UpdateProductCategoryRequest = {
  name: string
  description?: string
  version?: number
}

export type UpdateProductCategoryStatusRequest = {
  status: ProductCategoryStatus
  version?: number
}

export type MoveProductCategoryParentRequest = {
  parentCategoryUuid: string | null
  version?: number
}

export type ProductCategoryResponse = {
  categoryUuid: string
  code: string
  name: string
  description?: string
  parentCategoryUuid: string | null
  categoryLevel?: number
  status: ProductCategoryStatus
  version?: number
  createdAt?: string
  updatedAt?: string
}

export type ProductCategoryListParams = {
  search?: string
  query?: string
  status?: ProductCategoryStatus
  parentCategoryUuid?: string
  page?: number
  size?: number
}

export type ProductCategoryImportRowError = {
  field?: string
  message?: string
  rowNumber?: number
  reason?: string
} & Record<string, unknown>

export type ProductCategoryImportResultResponse = {
  totalRows: number
  importedRows: number
  failedRows: number
  rowErrors?: ProductCategoryImportRowError[]
  status: string
  successRows?: number
  diagnostics?: ProductCategoryImportRowError[]
} & Record<string, unknown>
