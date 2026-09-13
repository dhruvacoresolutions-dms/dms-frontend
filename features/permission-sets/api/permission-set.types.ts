export type PermissionSetStatus = "ACTIVE" | "INACTIVE"

/** BE: POST /permission-sets body. code must match `[A-Z0-9_]{2,80}`. */
export type CreatePermissionSetRequest = {
  code: string
  name: string
  description?: string
}

/** BE: PUT /permission-sets/{permissionSetUuid} body. */
export type UpdatePermissionSetRequest = {
  code: string
  name: string
  description?: string
}

export type PermissionCodesRequest = {
  permissionCodes: string[]
}

/** BE: GET /permission-sets list item — `data: [{ permissionSetUuid, code, name, status }]`. */
export type PermissionSetListItem = {
  permissionSetUuid: string
  code: string
  name: string
  status: PermissionSetStatus
}

/** Query params for listing permission sets. */
export type PermissionSetListParams = {
  search?: string
  status?: PermissionSetStatus
}

/** BE: POST /permission-sets success (201) — `data: { permissionSetUuid, code, name, status }`. */
export type PermissionSetCreateResponse = {
  permissionSetUuid: string
  code: string
  name: string
  status: PermissionSetStatus
}

/** BE: GET /permission-sets/{permissionSetUuid} success — `data: { permissionSetUuid, code, name, status, permissionCodes }`. */
export type PermissionSetDetail = {
  permissionSetUuid: string
  code: string
  name: string
  description?: string
  status: PermissionSetStatus
  permissionCodes?: string[]
  /** Legacy/alternate key some BE responses use — accepted as fallback. */
  permissions?: string[]
}

/** BE: PUT /permission-sets/{permissionSetUuid} success — `data: { permissionSetUuid, code, name }`. */
export type PermissionSetUpdateResponse = {
  permissionSetUuid: string
  code: string
  name: string
}

/** BE: PUT /permission-sets/{permissionSetUuid}/permissions success — `data: { permissionSetUuid, permissionCodes }`. */
export type PermissionSetPermissionsUpdateResponse = {
  permissionSetUuid: string
  permissionCodes: string[]
}

/**
 * Legacy alias kept for cross-module compat (e.g. user assignments).
 * New code should use {@link PermissionSetListItem} / {@link PermissionSetDetail}.
 */
export type PermissionSetResponse = PermissionSetListItem & {
  publicId: string
  description?: string
  permissions: string[]
  assignedUserCount: number
}
