export type DepartmentStatus = "ACTIVE" | "INACTIVE"

export type DepartmentResponse = {
  departmentUuid: string
  code: string
  name: string
  status: DepartmentStatus
  version: number
}

export type CreateDepartmentRequest = {
  code: string
  name: string
  status?: DepartmentStatus
}

export type UpdateDepartmentRequest = {
  code?: string
  name?: string
  status?: DepartmentStatus
  version: number
}

export type DepartmentListParams = {
  search?: string
  query?: string
  status?: DepartmentStatus
  page?: number
  size?: number
}
