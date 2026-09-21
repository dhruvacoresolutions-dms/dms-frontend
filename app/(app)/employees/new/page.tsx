"use client"

import { useAuthStore } from "@/stores/auth-store"
import { PageHeader } from "@/components/common/PageHeader"
import { RouteGate } from "@/components/auth/RouteGate"
import { PERMISSIONS } from "@/lib/permissions"
import { EmployeeCreateForm } from "@/features/employees/components/EmployeeCreateForm"

export default function NewEmployeePage() {
  const companyUuid = useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"

  return (
    <RouteGate permission={PERMISSIONS.EMPLOYEE.CREATE}>
      <div className="flex flex-1 flex-col gap-4">
        <PageHeader title="Create Employee" description="Add a new employee" />
        <EmployeeCreateForm companyUuid={companyUuid} redirectTo="/employees" />
      </div>
    </RouteGate>
  )
}
