export type PermissionResponse = {
  publicId: string
  code: string
  moduleCode: string
  resourceCode: string
  action: string
  name: string
  description?: string
  status: string
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
  moduleCode?: string
  resourceCode?: string
  action?: string
  status?: string
}
