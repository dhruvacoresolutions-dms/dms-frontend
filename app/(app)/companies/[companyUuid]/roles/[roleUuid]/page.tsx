"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Edit, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/common/PageHeader"
import { LoadingState } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { useRole } from "@/features/roles/hooks/use-role"
import { RoleInfoCard } from "@/features/roles/components/RoleInfoCard"
import { RolePermissionsCard } from "@/features/roles/components/RolePermissionsCard"
import { getRolePermissions } from "@/features/roles/utils/role.utils"

export default function CompanyRoleDetailPage() {
  const params = useParams<{ companyUuid: string; roleUuid: string }>()
  const { companyUuid, roleUuid } = params
  const { data: role, isLoading, error, refetch } = useRole(companyUuid, roleUuid)

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState onRetry={refetch} />
  if (!role) return <ErrorState message="Role not found" />

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title={role.name}
        description={`Code: ${role.code}`}
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={`/companies/${companyUuid}/roles`} />}
            >
              <ArrowLeft className="mr-2 size-4" /> Back
            </Button>
            <Button
              nativeButton={false}
              render={
                <Link
                  href={`/companies/${companyUuid}/roles/${roleUuid}/edit`}
                />
              }
            >
              <Edit className="mr-2 size-4" /> Edit
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={
                <Link
                  href={`/companies/${companyUuid}/roles/${roleUuid}/permissions`}
                />
              }
            >
              <Key className="mr-2 size-4" /> Manage Permissions
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <RoleInfoCard role={role} />
        <RolePermissionsCard permissionCodes={getRolePermissions(role)} />
      </div>
    </div>
  )
}
