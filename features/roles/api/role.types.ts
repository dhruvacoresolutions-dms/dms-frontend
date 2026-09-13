export type RoleStatus = "ACTIVE" | "INACTIVE"

/** BE: POST /roles body. code must match `[A-Z0-9_]{2,80}`. */
export type CreateRoleRequest = {
  code: string
  name: string
  description?: string
}

/** BE: PUT /roles/{roleUuid} body. */
export type UpdateRoleRequest = {
  name: string
  description?: string
  status: RoleStatus
}

/** BE: PUT /roles/{roleUuid}/permissions body. */
export type PermissionCodesRequest = {
  permissionCodes: string[]
}

/** BE: GET /roles list item — `data: [{ roleUuid, code, name, status }]`. */
export type RoleListItem = {
  roleUuid: string
  code: string
  name: string
  status: RoleStatus
}

/** Query params for listing roles. */
export type RoleListParams = {
  search?: string
  status?: RoleStatus
}

/** BE: POST /roles success — `data: { roleUuid, code, name, status }`. */
export type RoleCreateResponse = {
  roleUuid: string
  code: string
  name: string
  status: RoleStatus
}

/** BE: GET /roles/{roleUuid} success — `data: { roleUuid, code, name, status, permissionCodes }`. */
export type RoleDetail = {
  roleUuid: string
  code: string
  name: string
  description?: string
  status: RoleStatus
  permissionCodes: string[]
}

/** BE: PUT /roles/{roleUuid} success — `data: { roleUuid, name, status }`. */
export type RoleUpdateResponse = {
  roleUuid: string
  name: string
  status: RoleStatus
}

/** BE: PUT /roles/{roleUuid}/permissions success — `data: { roleUuid, permissionCodes }`. */
export type RolePermissionsUpdateResponse = {
  roleUuid: string
  permissionCodes: string[]
}

/**
 * Legacy alias kept for cross-module compat (e.g. user assignments).
 * New code should use {@link RoleListItem} / {@link RoleDetail}.
 */
export type RoleResponse = RoleListItem & {
  publicId: string
  description?: string
  roleType?: string
  systemDefined?: boolean
  permissions: string[]
}
