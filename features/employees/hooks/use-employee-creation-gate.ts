"use client"

import { useDepartments } from "@/features/departments/hooks/use-departments"
import { useDesignations } from "@/features/designations/hooks/use-designations"
import { useGeographies } from "@/features/geographies/hooks/use-geographies"

type CountQuery = {
  data?: { totalElements?: number; content?: unknown[] } | undefined
  isLoading: boolean
  isError: boolean
}

function isEmpty(query: CountQuery): boolean {
  // Fail open: if the check itself errors (or hasn't resolved), don't block creation
  if (query.isError || !query.data) return false
  return (query.data.totalElements ?? query.data.content?.length ?? 0) === 0
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ""
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
}

/**
 * Employees require at least one Designation, Geography and Department to exist.
 * Returns `disabled` + a `message` naming exactly the masters that are empty.
 */
export function useEmployeeCreationGate(companyUuid: string) {
  const designations = useDesignations(companyUuid, { page: 0, size: 1 })
  const geographies = useGeographies(companyUuid, { page: 0, size: 1 })
  const departments = useDepartments(companyUuid, { page: 0, size: 1 })

  const missing: string[] = []
  if (isEmpty(designations)) missing.push("Designation")
  if (isEmpty(geographies)) missing.push("Geography")
  if (isEmpty(departments)) missing.push("Department")

  const isChecking =
    designations.isLoading || geographies.isLoading || departments.isLoading
  const message =
    missing.length > 0
      ? `Create at least one ${joinNames(missing)} to add employees.`
      : null

  return {
    disabled: isChecking || missing.length > 0,
    message: isChecking ? null : message,
  }
}
