"use client"

import { useParams } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import Link from "next/link"
import { ArrowLeft, Edit, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/common/PageHeader"
import { LoadingState } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { usePermissionSet } from "@/features/permission-sets/hooks/use-permission-set"
import { PermissionSetInfoCard } from "@/features/permission-sets/components/PermissionSetInfoCard"
import { PermissionSetPermissionsCard } from "@/features/permission-sets/components/PermissionSetPermissionsCard"
import { getPermissionSetPermissions } from "@/features/permission-sets/utils/permission-set.utils"

export default function PermissionSetDetailPage() {
  const params = useParams<{ setUuid: string }>()
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const setUuid = params.setUuid
  const { data: set, isLoading, error, refetch } = usePermissionSet(companyUuid, setUuid)

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState onRetry={refetch} />
  if (!set) return <ErrorState message="Permission set not found" />

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title={set.name}
        description={`Code: ${set.code}`}
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/permission-sets" />}
            >
              <ArrowLeft className="mr-2 size-4" /> Back
            </Button>
            <Button
              nativeButton={false}
              render={<Link href={`/permission-sets/${setUuid}/edit`} />}
            >
              <Edit className="mr-2 size-4" /> Edit
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={`/permission-sets/${setUuid}/permissions`} />}
            >
              <Key className="mr-2 size-4" /> Manage Permissions
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <PermissionSetInfoCard set={set} />
        <PermissionSetPermissionsCard
          permissionCodes={getPermissionSetPermissions(set)}
        />
      </div>
    </div>
  )
}
