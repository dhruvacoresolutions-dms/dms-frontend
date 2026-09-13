"use client"

import { useParams } from "next/navigation"
import { PermissionSetListView } from "@/features/permission-sets/components/PermissionSetListView"

export default function CompanyPermissionSetsPage() {
  const params = useParams<{ companyUuid: string }>()
  return (
    <PermissionSetListView
      companyUuid={params.companyUuid}
      basePath={`/companies/${params.companyUuid}/permission-sets`}
    />
  )
}
