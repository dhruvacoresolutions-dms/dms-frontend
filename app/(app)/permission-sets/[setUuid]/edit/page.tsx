"use client"

import { useParams } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { PageHeader } from "@/components/common/PageHeader"
import { LoadingState } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { RouteGate } from "@/components/auth/RouteGate"
import { PERMISSIONS } from "@/lib/permissions"
import { usePermissionSet } from "@/features/permission-sets/hooks/use-permission-set"
import { PermissionSetEditForm } from "@/features/permission-sets/components/PermissionSetEditForm"

export default function EditPermissionSetPage() {
  const params = useParams<{ setUuid: string }>()
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const setUuid = params.setUuid
  const { data: set, isLoading, error, refetch } = usePermissionSet(companyUuid, setUuid)

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState onRetry={refetch} />
  if (!set) return <ErrorState message="Permission set not found" />

  return (
    <RouteGate permission={PERMISSIONS.PERMISSION_SET.UPDATE}>
      <div className="flex flex-1 flex-col gap-4">
        <PageHeader
          title="Edit Permission Set"
          description={`Editing ${set.name} (${set.code})`}
        />
        <PermissionSetEditForm
          companyUuid={companyUuid}
          setUuid={setUuid}
          set={set}
          onSuccessPath={`/permission-sets/${setUuid}`}
        />
      </div>
    </RouteGate>
  )
}
