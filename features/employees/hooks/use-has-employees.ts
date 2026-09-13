"use client"

import { useEmployees } from "./use-employees"

/**
 * Lightweight presence check: true when the company has at least
 * one employee (independent of any list filters on the page).
 */
export function useHasEmployees(companyUuid: string) {
  const query = useEmployees(companyUuid, { page: 0, size: 1 })
  return {
    ...query,
    hasEmployees: (query.data?.totalElements ?? 0) > 0,
  }
}
