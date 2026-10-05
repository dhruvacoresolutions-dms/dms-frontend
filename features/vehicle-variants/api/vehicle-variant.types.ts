export type VehicleVariantStatus = "ACTIVE" | "INACTIVE"

export type CreateVehicleVariantRequest = {
  modelUuid: string
  code: string
  name: string
}

export type UpdateVehicleVariantRequest = {
  modelUuid?: string
  name: string
  version?: number
}

export type UpdateVehicleVariantStatusRequest = {
  status: VehicleVariantStatus
  version?: number
}

export type VehicleVariantResponse = {
  variantUuid: string
  modelUuid: string
  modelCode?: string | null
  modelName?: string | null
  code: string
  name: string
  status: VehicleVariantStatus
  version?: number
  createdAt: string
  updatedAt: string
}

export type VehicleVariantListParams = {
  search?: string
  query?: string
  modelUuid?: string
  status?: VehicleVariantStatus
  page?: number
  size?: number
}

export type VehicleVariantImportDiagnostic = {
  sheet?: string
  rowNumber: number
  entityKey?: string
  field?: string
  rejectedValue?: string
  errorCode?: string
  reason?: string
}

export type VehicleVariantImportResponse = {
  totalRows: number
  importedRows?: number
  successRows?: number
  failedRows?: number
  rowErrors?: unknown[]
  status?: string
  diagnostics?: VehicleVariantImportDiagnostic[]
}
