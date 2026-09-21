/**
 * BE: GET /api/v1/permissions → `data: [{ publicId, code, moduleCode,
 * resourceCode, action, name, description, status }]`.
 * `action` is the real action field; `actionCode` is kept for backwards
 * compat with older payloads. `moduleCode` drives module-level grouping.
 */
export type PermissionResponse = {
  code: string
  name: string
  resourceCode: string
  action?: string
  actionCode?: string
  moduleCode?: string
  status: string
  /** Legacy fields (pre-BE-contract) — optional for backwards compat. */
  publicId?: string
  description?: string
}

export type PermissionActionResponse = {
  action: string
  permissionCode: string
}

export type PermissionResourceResponse = {
  resourceCode: string
  resourceName: string
  actions: PermissionActionResponse[]
}

export type PermissionModuleResponse = {
  moduleCode: string
  moduleName: string
  resources: PermissionResourceResponse[]
}

export type PermissionListParams = {
  search?: string
  moduleCode?: string
  resourceCode?: string
  action?: string
  status?: string
}
