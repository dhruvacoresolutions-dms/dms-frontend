export type UserStatus = "ACTIVE" | "INACTIVE"

export type CreateUserRequest = {
  username: string
  displayName: string
  email: string
  password: string
}

export type UpdateUserRequest = {
  displayName: string
  email: string
}

export type UpdateUserStatusRequest = {
  status: UserStatus
}

export type UserResponse = {
  userUuid: string
  username: string
  displayName: string
  email: string
  status: UserStatus
  createdAt: string
  updatedAt: string
}

export type UserListParams = {
  search?: string
  status?: UserStatus
  page?: number
  size?: number
}

export type EffectiveAccessResponse = {
  userPublicId: string
  companyPublicId: string
  companyCode: string
  roles: string[]
  permissionSets: string[]
  permissions: string[]
  scopes: Array<{ type: string; publicId: string }>
  enabledFeatures: string[]
}

export type AccessAssignmentResponse = {
  publicId: string
  code: string
  status: string
  validFrom?: string
  validUntil?: string
}

export type CreateRoleAssignmentRequest = {
  rolePublicId: string
  contextType: "PLATFORM" | "COMPANY" | "DISTRIBUTOR"
  contextUuid?: string
  scopeType: "COMPANY" | "GEOGRAPHY"
  scopePublicId?: string
  validFrom?: string
  validUntil?: string
}

export type PermissionSetAssignmentRequest = {
  permissionSetPublicId: string
  validFrom?: string
  validUntil?: string
}
