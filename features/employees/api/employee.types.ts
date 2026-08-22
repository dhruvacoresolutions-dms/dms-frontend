export type EmployeeStatus = "ACTIVE" | "INACTIVE"

export type CreateEmployeeRequest = {
  employeeCode: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  userUuid?: string
  designationUuid?: string
}

export type UpdateEmployeeRequest = {
  firstName: string
  lastName: string
  email: string
  phone?: string
  designationUuid?: string
}

export type UpdateEmployeeStatusRequest = {
  status: EmployeeStatus
}

export type EmployeeResponse = {
  employeeUuid: string
  employeeCode: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  status: EmployeeStatus
  userUuid?: string
  username?: string
  designationUuid?: string
  designationName?: string
  createdAt: string
  updatedAt: string
}

export type EmployeeListParams = {
  search?: string
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
