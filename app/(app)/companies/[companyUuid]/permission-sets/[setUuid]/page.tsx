"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { Edit, ArrowLeft, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/common/PageHeader"
import { StatusBadge } from "@/components/common/StatusBadge"
import { LoadingState } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { usePermissionSet } from "@/features/permission-sets/hooks/use-permission-set"

export default function PermissionSetDetailPage() {
  const params = useParams<{ companyUuid: string; setUuid: string }>()
  const companyUuid = params.companyUuid
  const setUuid = params.setUuid
  const { data: ps, isLoading, error, refetch } = usePermissionSet(companyUuid, setUuid)

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState onRetry={refetch} />
  if (!ps) return <ErrorState message="Permission set not found" />

  const grouped: Record<string, string[]> = {}
  for (const perm of ps.permissions) {
    const mod = perm.split(".")[0] ?? "other"
    if (!grouped[mod]) grouped[mod] = []
    grouped[mod].push(perm)
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title={ps.name}
        description={ps.description ?? `Code: ${ps.code}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" nativeButton={false} render={<Link href={`/companies/${companyUuid}/permission-sets`} />}>
              <ArrowLeft className="mr-2 size-4" /> Back
            </Button>
            <Button nativeButton={false} render={<Link href={`/companies/${companyUuid}/permission-sets/${setUuid}/edit`} />}>
              <Edit className="mr-2 size-4" /> Edit
            </Button>
            <Button variant="outline" nativeButton={false} render={<Link href={`/companies/${companyUuid}/permission-sets/${setUuid}/permissions`} />}>
              <Key className="mr-2 size-4" /> Manage Permissions
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-6 space-y-3">
          <h3 className="text-lg font-semibold">Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">UUID</span><span className="font-mono">{ps.publicId}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Code</span><span className="font-mono">{ps.code}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={ps.status} /></div>
          </div>
        </div>
        <div className="rounded-lg border p-6 space-y-3">
          <h3 className="text-lg font-semibold">Stats</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Permissions</span><span>{ps.permissions.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Assigned Users</span><span>{ps.assignedUserCount}</span></div>
          </div>
        </div>
      </div>

      {Object.keys(grouped).length > 0 && (
        <div className="rounded-lg border p-6 space-y-4">
          <h3 className="text-lg font-semibold">Permissions by Module</h3>
          <div className="space-y-4">
            {Object.entries(grouped).map(([mod, perms]) => (
              <div key={mod} className="space-y-2">
                <h4 className="text-sm font-medium capitalize">{mod}</h4>
                <div className="flex flex-wrap gap-1">
                  {perms.map((p) => (
                    <Badge key={p} variant="secondary" className="font-mono text-xs">{p}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
