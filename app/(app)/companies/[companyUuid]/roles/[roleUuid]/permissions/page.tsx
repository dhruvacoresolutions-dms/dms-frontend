"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/common/PageHeader"
import { LoadingState } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { useRole } from "@/features/roles/hooks/use-role"
import { RolePermissionsManager } from "@/features/roles/components/RolePermissionsManager"

export default function CompanyRolePermissionsPage() {
  const params = useParams<{ companyUuid: string; roleUuid: string }>()
  const { companyUuid, roleUuid } = params
  const { data: role, isLoading, error, refetch } = useRole(companyUuid, roleUuid)

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState onRetry={refetch} />
  if (!role) return <ErrorState message="Role not found" />

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title={`Manage Permissions: ${role.name}`}
        description="Saving replaces all current permissions for this role."
        action={
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/companies/${companyUuid}/roles/${roleUuid}`} />}
          >
            <ArrowLeft className="mr-2 size-4" /> Back
          </Button>
        }
      />
      <RolePermissionsManager
        companyUuid={companyUuid}
        roleUuid={roleUuid}
        role={role}
      />
    </div>
  )
}
