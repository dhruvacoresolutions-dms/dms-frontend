"use client"

import { useParams } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { PageHeader } from "@/components/common/PageHeader"
import { LoadingState } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { useRole } from "@/features/roles/hooks/use-role"
import { RoleEditForm } from "@/features/roles/components/RoleEditForm"

export default function EditRolePage() {
  const params = useParams<{ roleUuid: string }>()
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const roleUuid = params.roleUuid
  const { data: role, isLoading, error, refetch } = useRole(companyUuid, roleUuid)

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState onRetry={refetch} />
  if (!role) return <ErrorState message="Role not found" />

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader title="Edit Role" description={`Editing ${role.name} (${role.code})`} />
      <RoleEditForm
        companyUuid={companyUuid}
        roleUuid={roleUuid}
        role={role}
        onSuccessPath={`/roles/${roleUuid}`}
      />
    </div>
  )
}
