"use client"

import { useParams } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import Link from "next/link"
import { ArrowLeft, Edit, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/common/PageHeader"
import { LoadingState } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { RouteGate } from "@/components/auth/RouteGate"
import { PERMISSIONS } from "@/lib/permissions"
import { useRole } from "@/features/roles/hooks/use-role"
import { RoleInfoCard } from "@/features/roles/components/RoleInfoCard"
import { RolePermissionsCard } from "@/features/roles/components/RolePermissionsCard"
import { getRolePermissions } from "@/features/roles/utils/role.utils"

export default function RoleDetailPage() {
  const params = useParams<{ roleUuid: string }>()
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const roleUuid = params.roleUuid
  const { data: role, isLoading, error, refetch } = useRole(companyUuid, roleUuid)

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState onRetry={refetch} />
  if (!role) return <ErrorState message="Role not found" />

  return (
    <RouteGate permission={PERMISSIONS.ROLE.VIEW}>
      <div className="flex flex-1 flex-col gap-4">
        <PageHeader
          title={role.name}
          description={`Code: ${role.code}`}
          action={
            <div className="flex gap-2">
              <Button variant="outline" nativeButton={false} render={<Link href="/roles" />}>
                <ArrowLeft className="mr-2 size-4" /> Back
              </Button>
              <PermissionGate permission={PERMISSIONS.ROLE.UPDATE}>
                <Button nativeButton={false} render={<Link href={`/roles/${roleUuid}/edit`} />}>
                  <Edit className="mr-2 size-4" /> Edit
                </Button>
              </PermissionGate>
              <PermissionGate permission={PERMISSIONS.ROLE.PERMISSION_ASSIGN}>
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={<Link href={`/roles/${roleUuid}/permissions`} />}
                >
                  <Key className="mr-2 size-4" /> Manage Permissions
                </Button>
              </PermissionGate>
            </div>
          }
        />

      <div className="flex flex-1 flex-col gap-4">
        <RoleInfoCard role={role} />
        <RolePermissionsCard permissionCodes={getRolePermissions(role)} />
      </div>
    </div>
    </RouteGate>
  )
}
