"use client"

import { useParams } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/common/PageHeader"
import { LoadingState } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { RouteGate } from "@/components/auth/RouteGate"
import { PERMISSIONS } from "@/lib/permissions"
import { useRole } from "@/features/roles/hooks/use-role"
import { RolePermissionsManager } from "@/features/roles/components/RolePermissionsManager"

export default function RolePermissionsPage() {
  const params = useParams<{ roleUuid: string }>()
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const roleUuid = params.roleUuid
  const { data: role, isLoading, error, refetch } = useRole(companyUuid, roleUuid)

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState onRetry={refetch} />
  if (!role) return <ErrorState message="Role not found" />

  return (
    <RouteGate permission={PERMISSIONS.ROLE.PERMISSION_ASSIGN}>
      <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title={`Manage Permissions: ${role.name}`}
        description="Saving replaces all current permissions for this role."
        action={
          <Button variant="outline" nativeButton={false} render={<Link href={`/roles/${roleUuid}`} />}>
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
    </RouteGate>
  )
}
