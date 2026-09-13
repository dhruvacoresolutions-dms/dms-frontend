"use client"

import { format, isValid } from "date-fns"
import { StatusBadge } from "@/components/common/StatusBadge"
import { formatIndianMobileForDisplay } from "@/lib/utils/phone"
import type { EmployeeResponse } from "../api/employee.types"
import {
  EMPLOYEE_TYPE_OPTIONS,
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
} from "./EmployeeCreateForm"

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  // Plain yyyy-MM-dd dates: build a local date to avoid UTC-midnight
  // timezone shifting the day.
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (dateOnly) {
    const local = new Date(
      Number(dateOnly[1]),
      Number(dateOnly[2]) - 1,
      Number(dateOnly[3])
    )
    return isValid(local) ? format(local, "dd MMM yyyy") : iso
  }
  const parsed = new Date(iso)
  return isValid(parsed) ? format(parsed, "dd MMM yyyy") : iso
}

function labelFor(
  options: readonly { value: string; label: string }[],
  value: string | null | undefined
): string {
  if (!value) return "—"
  return options.find((o) => o.value === value)?.label ?? value
}

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right">{children}</span>
    </div>
  )
}

export function EmployeeOverview({
  employee,
}: {
  employee: EmployeeResponse
}) {
  const fullName =
    employee.fullName ?? `${employee.firstName} ${employee.lastName}`.trim()
  const mobile = employee.mobile ?? employee.phone
  const designation = employee.designationName
    ? employee.designationCode
      ? `${employee.designationName} (${employee.designationCode})`
      : employee.designationName
    : "—"
  const department = employee.departmentName
    ? employee.departmentCode
      ? `${employee.departmentName} (${employee.departmentCode})`
      : employee.departmentName
    : "—"
  const reportsTo = employee.reportsToEmployeeName
    ? employee.reportsToEmployeeCode
      ? `${employee.reportsToEmployeeName} (${employee.reportsToEmployeeCode})`
      : employee.reportsToEmployeeName
    : "—"

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-6 space-y-3">
        <h3 className="text-lg font-semibold">Personal Information</h3>
        <div className="space-y-2 text-sm">
          <Row label="Employee Code">
            <span className="font-mono">{employee.employeeCode}</span>
          </Row>
          <Row label="Full Name">{fullName}</Row>
          <Row label="Mobile">
            {mobile ? formatIndianMobileForDisplay(mobile, true) : "—"}
          </Row>
          <Row label="Email">{employee.email ?? "—"}</Row>
          <Row label="Gender">{labelFor(GENDER_OPTIONS, employee.gender)}</Row>
          <Row label="Date of Birth">{formatDate(employee.dateOfBirth)}</Row>
          <Row label="Marital Status">
            {labelFor(MARITAL_STATUS_OPTIONS, employee.maritalStatus)}
          </Row>
          <Row label="Anniversary Date">
            {formatDate(employee.anniversaryDate)}
          </Row>
        </div>
      </div>

      <div className="rounded-lg border p-6 space-y-3">
        <h3 className="text-lg font-semibold">Employment Details</h3>
        <div className="space-y-2 text-sm">
          <Row label="Designation">{designation}</Row>
          {employee.designationHierarchyLevel != null && (
            <Row label="Hierarchy Level">
              {employee.designationHierarchyLevel}
            </Row>
          )}
          <Row label="Department">{department}</Row>
          <Row label="Reports To">{reportsTo}</Row>
          <Row label="Employee Type">
            {labelFor(EMPLOYEE_TYPE_OPTIONS, employee.employeeType)}
          </Row>
          <Row label="Date of Joining">
            {formatDate(employee.dateOfJoining)}
          </Row>
          <Row label="Status">
            <StatusBadge status={employee.status} />
          </Row>
          <Row label="Created">{formatDate(employee.createdAt)}</Row>
          <Row label="Updated">{formatDate(employee.updatedAt)}</Row>
        </div>
      </div>
    </div>
  )
}
