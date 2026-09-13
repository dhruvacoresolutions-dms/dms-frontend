"use client"

import { useParams } from "next/navigation"
import { PageHeader } from "@/components/common/PageHeader"
import { EmployeeCreateForm } from "@/features/employees/components/EmployeeCreateForm"

export default function NewEmployeePage() {
  const params = useParams<{ companyUuid: string }>()
  const companyUuid = params.companyUuid

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader title="Create Employee" description="Add a new employee" />
      <EmployeeCreateForm
        companyUuid={companyUuid}
        redirectTo={`/companies/${companyUuid}/employees`}
      />
    </div>
  )
}
