"use client"

import { useParams } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { PageHeader } from "@/components/common/PageHeader"
import { RouteGate } from "@/components/auth/RouteGate"
import { PERMISSIONS } from "@/lib/permissions"
import { useEmployee } from "@/features/employees/hooks/use-employee"
import { EmployeeEditForm } from "@/features/employees/components/EmployeeEditForm"

export default function EditEmployeePage() {
  const params = useParams<{ employeeUuid: string }>()
  const companyUuid = useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const employeeUuid = params.employeeUuid
  const { data: employee } = useEmployee(companyUuid, employeeUuid)

  return (
    <RouteGate permission={PERMISSIONS.EMPLOYEE.UPDATE}>
      <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Edit Employee"
        description={
          employee
            ? `Editing ${employee.fullName ?? `${employee.firstName} ${employee.lastName}`}`
            : "Edit employee"
        }
      />
      <EmployeeEditForm
        companyUuid={companyUuid}
        employeeUuid={employeeUuid}
        redirectTo={`/employees/${employeeUuid}`}
      />
    </div>
    </RouteGate>
  )
}
