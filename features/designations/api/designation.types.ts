export type DesignationStatus = "ACTIVE" | "INACTIVE"

export type CreateDesignationRequest = {
  code: string
  name: string
  hierarchyLevel: number
  description?: string
}

export type UpdateDesignationRequest = {
  name: string
  hierarchyLevel: number
  description?: string
}

export type UpdateDesignationStatusRequest = {
  status: DesignationStatus
}

export type DesignationResponse = {
  publicId: string
  designationUuid: string
  code: string
  name: string
  hierarchyLevel: number
  description?: string
  status: DesignationStatus
  createdAt: string
  updatedAt: string
}

export type DesignationListParams = {
  search?: string
  query?: string
  status?: DesignationStatus
  page?: number
  size?: number
}

export type DesignationImportJobDiagnostic = {
  sheet?: string
  rowNumber: number
  entityKey?: string
  field?: string
  rejectedValue?: string
  errorCode?: string
  reason?: string
}

export type DesignationImportJobResponse = {
  jobUuid: string
  status: string
  totalRows: number
  successRows?: number
  failedRows?: number
  diagnostics?: DesignationImportJobDiagnostic[]
}
