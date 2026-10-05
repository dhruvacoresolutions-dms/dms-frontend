"use client"

import { useQuery } from "@tanstack/react-query"
import { getRelationshipType } from "../api/relationship-type.api"
import { relationshipTypeKeys } from "../api/relationship-type-keys"

export function useRelationshipType(
  companyUuid: string,
  relationshipTypeUuid: string
) {
  return useQuery({
    queryKey: relationshipTypeKeys.detail(companyUuid, relationshipTypeUuid),
    queryFn: () => getRelationshipType(companyUuid, relationshipTypeUuid),
    enabled: !!companyUuid && !!relationshipTypeUuid,
  })
}
