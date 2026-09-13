"use client"

import { useParams } from "next/navigation"
import { RoleListView } from "@/features/roles/components/RoleListView"

export default function CompanyRolesPage() {
  const params = useParams<{ companyUuid: string }>()
  return (
    <RoleListView
      companyUuid={params.companyUuid}
      basePath={`/companies/${params.companyUuid}/roles`}
    />
  )
}
