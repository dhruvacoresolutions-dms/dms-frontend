export type PermissionSetStatus = "ACTIVE" | "INACTIVE"

export type CreatePermissionSetRequest = {
  code: string
  name: string
  description?: string
}

export type UpdatePermissionSetRequest = {
  code: string
  name: string
  description?: string
}

export type PermissionCodesRequest = {
  permissionCodes: string[]
}

export type PermissionSetResponse = {
  publicId: string
  code: string
  name: string
  description?: string
  status: PermissionSetStatus
  permissions: string[]
  assignedUserCount: number
}
