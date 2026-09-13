export type EmployeeStatus = "ACTIVE" | "INACTIVE"

export type CreateEmployeeRequest = {
  employeeCode: string
  firstName: string
  lastName: string
  mobile?: string
  phone?: string
  email?: string
  designationUuid?: string
  reportsToEmployeeUuid?: string
  dateOfJoining?: string
}

export type UpdateEmployeeRequest = {
  employeeCode?: string
  firstName: string
  lastName: string
  mobile?: string
  email?: string
  phone?: string
  designationUuid?: string
  reportsToEmployeeUuid?: string | null
  dateOfJoining?: string
}

export type UpdateEmployeeStatusRequest = {
  status: EmployeeStatus
}

export type EmployeeResponse = {
  employeeUuid: string
  publicId: string
  employeeCode: string
  firstName: string
  lastName: string
  mobile?: string | null
  phone?: string | null
  email?: string | null
  status: EmployeeStatus
  userUuid?: string
  username?: string
  designationUuid?: string
  designationName?: string
  reportsToEmployeeUuid?: string | null
  dateOfJoining?: string | null
  createdAt: string
  updatedAt: string
}

export type EmployeeListParams = {
  search?: string
  query?: string
  status?: EmployeeStatus
  designationUuid?: string
  page?: number
  size?: number
}

export type EmployeeGeographyResponse = {
  assignmentUuid: string
  employeeUuid: string
  geographyUuid: string
  geographyCode: string
  geographyName: string
  geographyType: string
  primaryAssignment: boolean
  assignedAt: string
}

export type AssignEmployeeGeographyRequest = {
  geographyUuid: string
  primaryAssignment?: boolean
}

export type EmployeeLoginStatusResponse = {
  enabled: boolean
  status: string
  username?: string | null
  lastLoginAt?: string | null
}

export type EnableEmployeeLoginRequest = {
  roleUuid: string
}

export type EmployeeImportJobResponse = {
  publicId: string
  importJobUuid: string
  status: string
  totalRows: number
  processedRows?: number
  successCount?: number
  failureCount?: number
  createdAt: string
}

export type EmployeeImportRowResponse = {
  rowNumber: number
  status: string
  errors?: string[]
  employeeCode?: string
}

export type EmployeeImportJobDiagnostic = {
  sheet?: string
  rowNumber: number
  entityKey?: string
  field?: string
  rejectedValue?: string
  errorCode?: string
  reason?: string
}

export type EmployeeImportJobStatusResponse = {
  jobUuid: string
  status: string
  totalRows: number
  successRows?: number
  failedRows?: number
  diagnostics?: EmployeeImportJobDiagnostic[]
}

export type EmployeeGeographyImportUploadResponse = {
  jobUuid: string
  status: string
}

export type EmployeeGeographyImportJobResponse = {
  jobUuid: string
  status: string
  totalRows: number
  successRows?: number
  failedRows?: number
  diagnostics?: EmployeeImportJobDiagnostic[]
}

export type EmployeeImportRowDetailResponse = {
  rowNumber: number
  employeeCode?: string | null
  validationStatus?: string | null
  processingStatus?: string | null
  errorCode?: string | null
  errorMessage?: string | null
  employeeUuid?: string | null
}
