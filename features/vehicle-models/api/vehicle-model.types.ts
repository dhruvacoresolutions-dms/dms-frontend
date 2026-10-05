export type VehicleModelStatus = "ACTIVE" | "INACTIVE"

export type CreateVehicleModelRequest = {
  makeUuid: string
  code: string
  name: string
}

export type UpdateVehicleModelRequest = {
  makeUuid?: string
  name: string
  version?: number
}

export type UpdateVehicleModelStatusRequest = {
  status: VehicleModelStatus
  version?: number
}

export type VehicleModelResponse = {
  modelUuid: string
  makeUuid: string
  makeCode?: string | null
  makeName?: string | null
  code: string
  name: string
  status: VehicleModelStatus
  version?: number
  createdAt: string
  updatedAt: string
}

export type VehicleModelListParams = {
  search?: string
  query?: string
  makeUuid?: string
  status?: VehicleModelStatus
  page?: number
  size?: number
}

export type VehicleModelImportDiagnostic = {
  sheet?: string
  rowNumber: number
  entityKey?: string
  field?: string
  rejectedValue?: string
  errorCode?: string
  reason?: string
}

export type VehicleModelImportResponse = {
  totalRows: number
  importedRows?: number
  successRows?: number
  failedRows?: number
  rowErrors?: unknown[]
  status?: string
  diagnostics?: VehicleModelImportDiagnostic[]
}
