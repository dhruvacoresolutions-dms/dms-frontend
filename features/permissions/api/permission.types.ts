/**
 * BE: GET /api/v1/permissions → `data: [{ code, name, resourceCode, actionCode, status }]`.
 * Note: some catalog entries arrive without `actionCode` — treat it as optional.
 */
export type PermissionResponse = {
  code: string
  name: string
  resourceCode: string
  actionCode?: string
  status: string
  /** Legacy fields (pre-BE-contract) — optional for backwards compat. */
  publicId?: string
  moduleCode?: string
  action?: string
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
