/**
 * The four distributor reference masters share one contract shape
 * (`{ uuid, code, name, description?, requiresParent?, status, version }`)
 * and differ only by their URL segment.
 */
export type DistributorReferenceKind =
  | "distributor-types"
  | "business-constitutions"
  | "payment-terms"
  | "tax-profiles"

export type ReferenceStatus = "ACTIVE" | "INACTIVE"

export type CreateDistributorReferenceRequest = {
  code: string
  name: string
  description?: string
  requiresParent?: boolean
}

export type UpdateDistributorReferenceRequest = {
  name: string
  description?: string
  requiresParent?: boolean
  version?: number
}

export type UpdateDistributorReferenceStatusRequest = {
  status: ReferenceStatus
  version?: number
}

export type DistributorReferenceResponse = {
  uuid: string
  code: string
  name: string
  description?: string | null
  requiresParent?: boolean
  status: ReferenceStatus
  version?: number
  createdAt?: string
  updatedAt?: string
}

export type DistributorReferenceListParams = {
  search?: string
  status?: ReferenceStatus
  page?: number
  size?: number
}

export const DISTRIBUTOR_REFERENCE_KINDS: {
  kind: DistributorReferenceKind
  label: string
  singular: string
}[] = [
  { kind: "distributor-types", label: "Distributor Types", singular: "Distributor Type" },
  {
    kind: "business-constitutions",
    label: "Business Constitutions",
    singular: "Business Constitution",
  },
  { kind: "payment-terms", label: "Payment Terms", singular: "Payment Term" },
  { kind: "tax-profiles", label: "Tax Profiles", singular: "Tax Profile" },
]
