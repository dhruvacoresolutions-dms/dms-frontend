export type ProductAttributeDataType =
  | "NUMBER"
  | "TEXT"
  | "DATE"
  | "BOOLEAN"
  | "DROPDOWN"

export type ProductAttributeStatus = "ACTIVE" | "INACTIVE"

export type ProductAttributeTemplateResponse = {
  templateUuid: string
  productType: string
  attributeKey: string
  label: string
  dataType: ProductAttributeDataType
  slotAssignment: string
  mandatory: boolean
  displayOrder: number
  status: ProductAttributeStatus
  version: number
  createdAt: string
  updatedAt: string
}

export type CreateProductAttributeTemplateRequest = {
  productType: string
  attributeKey: string
  label: string
  dataType: ProductAttributeDataType
  slotAssignment?: string
  mandatory?: boolean
  displayOrder?: number
}

export type UpdateProductAttributeTemplateRequest = {
  label?: string
  mandatory?: boolean
  displayOrder?: number
  version: number
}

export type UpdateProductAttributeTemplateStatusRequest = {
  status: ProductAttributeStatus
  version: number
}

export type ProductAttributeTemplateListParams = {
  search?: string
  query?: string
  productType?: string
  status?: ProductAttributeStatus
  page?: number
  size?: number
}

export type ProductAttributeOptionResponse = {
  optionUuid: string
  templateUuid: string
  code: string
  label: string
  displayOrder: number
  status: ProductAttributeStatus
  version: number
  createdAt: string
  updatedAt: string
}

export type CreateProductAttributeOptionRequest = {
  code: string
  label: string
  displayOrder?: number
}

export type UpdateProductAttributeOptionRequest = {
  label?: string
  displayOrder?: number
  version: number
}

export type UpdateProductAttributeOptionStatusRequest = {
  status: ProductAttributeStatus
  version: number
}

export type ProductAttributeTemplateImportRowError = {
  row?: number
  field?: string
  message?: string
  reason?: string
} & Record<string, unknown>

export type ProductAttributeTemplateImportResult = {
  totalRows: number
  importedRows?: number
  successRows?: number
  failedRows?: number
  status?: string
  rowErrors?: ProductAttributeTemplateImportRowError[]
  diagnostics?: ProductAttributeTemplateImportRowError[]
} & Record<string, unknown>
