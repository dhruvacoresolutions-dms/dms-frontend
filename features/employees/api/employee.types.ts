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
