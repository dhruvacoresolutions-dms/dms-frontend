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
import { usePermissionSet } from "@/features/permission-sets/hooks/use-permission-set"
import { PermissionSetPermissionsManager } from "@/features/permission-sets/components/PermissionSetPermissionsManager"

export default function PermissionSetPermissionsPage() {
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
        title={`Manage Permissions: ${set.name}`}
        description="Saving replaces all current permissions for this permission set."
        action={
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/permission-sets/${setUuid}`} />}
          >
            <ArrowLeft className="mr-2 size-4" /> Back
          </Button>
        }
      />
      <PermissionSetPermissionsManager
        companyUuid={companyUuid}
        setUuid={setUuid}
        set={set}
      />
    </div>
    </RouteGate>
  )
}
