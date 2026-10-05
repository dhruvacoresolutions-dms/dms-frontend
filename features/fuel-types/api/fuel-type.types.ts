export type FuelTypeStatus = "ACTIVE" | "INACTIVE"

export type CreateFuelTypeRequest = {
  code: string
  name: string
}

export type UpdateFuelTypeRequest = {
  name: string
  version?: number
}

export type UpdateFuelTypeStatusRequest = {
  status: FuelTypeStatus
  version?: number
}

export type FuelTypeResponse = {
  /** Backend sample uses `uuid`; tolerate `fuelTypeUuid` alias. */
  uuid?: string
  fuelTypeUuid?: string
  code: string
  name: string
  status: FuelTypeStatus
  version?: number
  createdAt: string
  updatedAt: string
}

/** Resolve the canonical id regardless of which uuid field the backend sent. */
export function getFuelTypeId(fuelType: FuelTypeResponse): string {
  return fuelType.fuelTypeUuid ?? fuelType.uuid ?? ""
}

export type FuelTypeListParams = {
  search?: string
  query?: string
  status?: FuelTypeStatus
  page?: number
  size?: number
}

export type FuelTypeImportDiagnostic = {
  sheet?: string
  rowNumber: number
  entityKey?: string
  field?: string
  rejectedValue?: string
  errorCode?: string
  reason?: string
}

export type FuelTypeImportResponse = {
  totalRows: number
  importedRows?: number
  successRows?: number
  failedRows?: number
  rowErrors?: unknown[]
  status?: string
  diagnostics?: FuelTypeImportDiagnostic[]
}
