export type GeographyType =
  | "COUNTRY"
  | "ZONE"
  | "STATE"
  | "REGION"
  | "TERRITORY"
  | "BEAT"

export type GeographyStatus = "ACTIVE" | "INACTIVE"

export type CreateGeographyRequest = {
  code: string
  name: string
  type: GeographyType
  parentUuid?: string
  description?: string
}

export type UpdateGeographyRequest = {
  name: string
  parentUuid?: string
  description?: string
}

export type UpdateGeographyStatusRequest = {
  status: GeographyStatus
}

export type GeographyResponse = {
  geographyUuid: string
  code: string
  name: string
  type: GeographyType
  parentUuid: string | null
  parentCode: string | null
  parentName: string | null
  parentType: GeographyType | null
  description?: string
  status: GeographyStatus
  createdAt: string
  updatedAt: string
}

export type GeographyListParams = {
  search?: string
  query?: string
  type?: GeographyType
  parentUuid?: string
  status?: GeographyStatus
  page?: number
  size?: number
}
