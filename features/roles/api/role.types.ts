export type RoleStatus = "ACTIVE" | "INACTIVE"

export type CreateRoleRequest = {
  code: string
  name: string
  description?: string
}

export type UpdateRoleRequest = {
  name: string
  description?: string
  status: RoleStatus
}

export type PermissionCodesRequest = {
  permissionCodes: string[]
}

export type RoleResponse = {
  publicId: string
  code: string
  name: string
  description?: string
  roleType: string
  systemDefined: boolean
  status: RoleStatus
  permissions: string[]
}
