export type DesignationStatus = "ACTIVE" | "INACTIVE"

export type CreateDesignationRequest = {
  code: string
  name: string
  description?: string
}

export type UpdateDesignationRequest = {
  name: string
  description?: string
}

export type UpdateDesignationStatusRequest = {
  status: DesignationStatus
}

export type DesignationResponse = {
  designationUuid: string
  code: string
  name: string
  description?: string
  status: DesignationStatus
  createdAt: string
  updatedAt: string
}

export type DesignationListParams = {
  search?: string
  status?: DesignationStatus
  page?: number
  size?: number
}
