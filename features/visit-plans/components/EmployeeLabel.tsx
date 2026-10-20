"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { useEmployee } from "@/features/employees/hooks/use-employee"

type EmployeeLabelProps = {
  companyUuid: string
  employeeUuid?: string | null
  /** Rendered when no employee is assigned. */
  fallback?: string
}

/** Cached employee-name lookup used by plan lists and detail views. */
export function EmployeeLabel({
  companyUuid,
  employeeUuid,
  fallback = "—",
}: EmployeeLabelProps) {
  const { data, isLoading } = useEmployee(companyUuid, employeeUuid ?? "")

  if (!employeeUuid) {
    return <span className="text-muted-foreground">{fallback}</span>
  }
  if (isLoading) {
    return (
      <span className="inline-flex items-center" aria-busy="true">
        <span className="sr-only">Loading employee</span>
        <Skeleton className="h-4 w-28" />
      </span>
    )
  }
  if (!data) {
    return (
      <span className="text-muted-foreground" title={employeeUuid}>
        Unknown employee
      </span>
    )
  }

  const name =
    data.fullName?.trim() ||
    `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim()

  return <span title={data.employeeCode}>{name || data.employeeCode}</span>
}
