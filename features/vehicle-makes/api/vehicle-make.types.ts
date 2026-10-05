export type VehicleMakeStatus = "ACTIVE" | "INACTIVE"

export type CreateVehicleMakeRequest = {
  code: string
  name: string
  description?: string
}

export type UpdateVehicleMakeRequest = {
  name: string
  description?: string
  version?: number
}

export type UpdateVehicleMakeStatusRequest = {
  status: VehicleMakeStatus
  version?: number
}

export type VehicleMakeResponse = {
  makeUuid: string
  code: string
  name: string
  description?: string
  status: VehicleMakeStatus
  version?: number
  createdAt: string
  updatedAt: string
}

export type VehicleMakeListParams = {
  search?: string
  query?: string
  status?: VehicleMakeStatus
  page?: number
  size?: number
}

export type VehicleMakeImportDiagnostic = {
  sheet?: string
  rowNumber: number
  entityKey?: string
  field?: string
  rejectedValue?: string
  errorCode?: string
  reason?: string
}

export type VehicleMakeImportResponse = {
  totalRows: number
  importedRows?: number
  successRows?: number
  failedRows?: number
  rowErrors?: unknown[]
  status?: string
  diagnostics?: VehicleMakeImportDiagnostic[]
}
