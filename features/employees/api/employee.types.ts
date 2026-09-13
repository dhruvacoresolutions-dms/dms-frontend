export type EmployeeStatus = "ACTIVE" | "INACTIVE"

export type EmployeeGender = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY"

export type EmployeeType = "PERMANENT" | "CONTRACT" | "TEMPORARY"

export type EmployeeMaritalStatus = "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED"

export type CreateEmployeeRequest = {
  employeeCode: string
  firstName: string
  lastName: string
  mobile?: string
  phone?: string
  email?: string
  designationUuid?: string
  departmentUuid?: string
  reportsToEmployeeUuid?: string
  dateOfJoining?: string
  gender?: EmployeeGender
  dateOfBirth?: string
  employeeType?: EmployeeType
  status?: EmployeeStatus
  maritalStatus?: EmployeeMaritalStatus
  anniversaryDate?: string | null
}

export type UpdateEmployeeRequest = {
  employeeCode?: string
  firstName: string
  lastName: string
  mobile?: string
  email?: string
  phone?: string
  designationUuid?: string
  departmentUuid?: string
  reportsToEmployeeUuid?: string | null
  dateOfJoining?: string
  gender?: EmployeeGender
  dateOfBirth?: string
  employeeType?: EmployeeType
  status?: EmployeeStatus
  maritalStatus?: EmployeeMaritalStatus
  anniversaryDate?: string | null
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
  fullName?: string | null
  mobile?: string | null
  phone?: string | null
  email?: string | null
  status: EmployeeStatus
  userUuid?: string
  username?: string
  designationUuid?: string
  designationCode?: string | null
  designationName?: string
  designationHierarchyLevel?: number | null
  reportsToEmployeeUuid?: string | null
  reportsToEmployeeCode?: string | null
  reportsToEmployeeName?: string | null
  dateOfJoining?: string | null
  gender?: EmployeeGender | null
  dateOfBirth?: string | null
  employeeType?: EmployeeType | null
  departmentUuid?: string
  departmentCode?: string | null
  departmentName?: string | null
  maritalStatus?: EmployeeMaritalStatus | null
  anniversaryDate?: string | null
  profilePhotoConfigured?: boolean
  profilePhotoContentType?: string | null
  profilePhotoSizeBytes?: number | null
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

/** Query params for listing an employee's geography assignments. */
export type EmployeeGeographyListParams = {
  search?: string
}

/** Query params for listing employee import rows. */
export type EmployeeImportRowListParams = {
  search?: string
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

export type BulkEnableEmployeeLoginRequest = {
  employeeUuids: string[]
  roleUuid: string
}

export type BulkDisableEmployeeLoginRequest = {
  employeeUuids: string[]
}

export type BulkLoginResultEntry = {
  employeeUuid: string
  employeeCode?: string
  employeeName?: string
  /** "SUCCESS" / "FAILED" / "SKIPPED" */
  status?: string
  userUuid?: string
  username?: string
  temporaryPassword?: string
  emailDispatched?: boolean
  errorCode?: string | null
  message?: string
  error?: string
  reason?: string
}

/** Normalized bulk-operation envelope. The backend returns
 * `{total, successful, skipped, failed, results[]}`; legacy
 * `{succeeded[], failed[]}` payloads are normalized to this shape. */
export type BulkOperationSummary = {
  total: number
  successful: number
  skipped: number
  failed: number
  results: BulkLoginResultEntry[]
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
