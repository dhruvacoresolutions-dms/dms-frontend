export type RelationshipTypeStatus = "ACTIVE" | "INACTIVE"

export type CreateRelationshipTypeRequest = {
  code: string
  name: string
}

export type UpdateRelationshipTypeRequest = {
  name: string
  version?: number
}

export type UpdateRelationshipTypeStatusRequest = {
  status: RelationshipTypeStatus
  version?: number
}

export type RelationshipTypeResponse = {
  /** Backend sample uses `uuid`; tolerate `relationshipTypeUuid` alias. */
  uuid?: string
  relationshipTypeUuid?: string
  code: string
  name: string
  status: RelationshipTypeStatus
  version?: number
  createdAt: string
  updatedAt: string
}

/** Resolve the canonical id regardless of which uuid field the backend sent. */
export function getRelationshipTypeId(
  relationshipType: RelationshipTypeResponse
): string {
  return (
    relationshipType.relationshipTypeUuid ?? relationshipType.uuid ?? ""
  )
}

export type RelationshipTypeListParams = {
  search?: string
  query?: string
  status?: RelationshipTypeStatus
  page?: number
  size?: number
}

export type RelationshipTypeImportDiagnostic = {
  sheet?: string
  rowNumber: number
  entityKey?: string
  field?: string
  rejectedValue?: string
  errorCode?: string
  reason?: string
}

export type RelationshipTypeImportResponse = {
  totalRows: number
  importedRows?: number
  successRows?: number
  failedRows?: number
  rowErrors?: unknown[]
  status?: string
  diagnostics?: RelationshipTypeImportDiagnostic[]
}
