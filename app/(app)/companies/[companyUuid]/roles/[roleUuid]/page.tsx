"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { Edit, ArrowLeft, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/common/PageHeader"
import { StatusBadge } from "@/components/common/StatusBadge"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { useRole } from "@/features/roles/hooks/use-role"

export default function RoleDetailPage() {
  const params = useParams<{ companyUuid: string; roleUuid: string }>()
  const companyUuid = params.companyUuid
  const roleUuid = params.roleUuid
  const { data: role, isLoading, error, refetch } = useRole(companyUuid, roleUuid)

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState onRetry={refetch} />
  if (!role) return <ErrorState message="Role not found" />

  const groupedPerms: Record<string, string[]> = {}
  for (const perm of role.permissions) {
    const parts = perm.split(".")
    const mod = parts[0] ?? "other"
    if (!groupedPerms[mod]) groupedPerms[mod] = []
    groupedPerms[mod].push(perm)
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title={role.name}
        description={role.description ?? `Code: ${role.code}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" nativeButton={false} render={<Link href={`/companies/${companyUuid}/roles`} />}>
              <ArrowLeft className="mr-2 size-4" /> Back
            </Button>
            <Button nativeButton={false} render={<Link href={`/companies/${companyUuid}/roles/${roleUuid}/edit`} />}>
              <Edit className="mr-2 size-4" /> Edit
            </Button>
            <Button variant="outline" nativeButton={false} render={<Link href={`/companies/${companyUuid}/roles/${roleUuid}/permissions`} />}>
              <Key className="mr-2 size-4" /> Manage Permissions
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-6 space-y-3">
          <h3 className="text-lg font-semibold">Role Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">UUID</span><span className="font-mono">{role.publicId}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Code</span><span className="font-mono">{role.code}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span>{role.systemDefined ? "System" : "Custom"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={role.status} /></div>
          </div>
        </div>
        <div className="rounded-lg border p-6 space-y-3">
          <h3 className="text-lg font-semibold">Permissions</h3>
          <p className="text-sm text-muted-foreground">{role.permissions.length} permission(s) assigned</p>
        </div>
      </div>

      {Object.keys(groupedPerms).length > 0 && (
        <div className="rounded-lg border p-6 space-y-4">
          <h3 className="text-lg font-semibold">Permissions by Module</h3>
          <div className="space-y-4">
            {Object.entries(groupedPerms).map(([mod, perms]) => (
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
