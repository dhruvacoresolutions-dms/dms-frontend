export type FitmentPositionStatus = "ACTIVE" | "INACTIVE"

export type CreateFitmentPositionRequest = {
  code: string
  name: string
}

export type UpdateFitmentPositionRequest = {
  name: string
  version?: number
}

export type UpdateFitmentPositionStatusRequest = {
  status: FitmentPositionStatus
  version?: number
}

export type FitmentPositionResponse = {
  /** Backend sample uses `uuid`; tolerate `fitmentPositionUuid` alias. */
  uuid?: string
  fitmentPositionUuid?: string
  code: string
  name: string
  status: FitmentPositionStatus
  version?: number
  createdAt: string
  updatedAt: string
}

/** Resolve the canonical id regardless of which uuid field the backend sent. */
export function getFitmentPositionId(
  fitmentPosition: FitmentPositionResponse
): string {
  return fitmentPosition.fitmentPositionUuid ?? fitmentPosition.uuid ?? ""
}

export type FitmentPositionListParams = {
  search?: string
  query?: string
  status?: FitmentPositionStatus
  page?: number
  size?: number
}

export type FitmentPositionImportDiagnostic = {
  sheet?: string
  rowNumber: number
  entityKey?: string
  field?: string
  rejectedValue?: string
  errorCode?: string
  reason?: string
}

export type FitmentPositionImportResponse = {
  totalRows: number
  importedRows?: number
  successRows?: number
  failedRows?: number
  rowErrors?: unknown[]
  status?: string
  diagnostics?: FitmentPositionImportDiagnostic[]
}
