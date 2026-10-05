"use client"

import { useQuery } from "@tanstack/react-query"
import { getRelationshipTypes } from "../api/relationship-type.api"
import { relationshipTypeKeys } from "../api/relationship-type-keys"
import type { RelationshipTypeListParams } from "../api/relationship-type.types"

export function useRelationshipTypes(
  companyUuid: string,
  params?: RelationshipTypeListParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: relationshipTypeKeys.list(companyUuid, params),
    queryFn: () => getRelationshipTypes(companyUuid, params),
    enabled: !!companyUuid && (options?.enabled ?? true),
  })
}
