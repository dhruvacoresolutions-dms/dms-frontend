"use client"

import { useEffect } from "react"
import { LoadingState } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { useEffectiveAccess } from "@/features/users/hooks/use-effective-access"

type Props = {
  companyUuid: string
  userUuid: string
}

export function UserEffectiveAccessSection({ companyUuid, userUuid }: Props) {
  const { data: access, isLoading, error, refetch } = useEffectiveAccess(
    companyUuid,
    userUuid
  )

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState onRetry={refetch} />
  if (!access) return <ErrorState message="No access data found" />

  const groupedPermissions: Record<string, string[]> = {}
  for (const perm of access.permissions) {
    const parts = perm.split(".")
    const module = parts[0] ?? "other"
    if (!groupedPermissions[module]) {
      groupedPermissions[module] = []
    }
    groupedPermissions[module].push(perm)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4 space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Roles</h4>
          {access.roles.length === 0 ? (
            <p className="text-sm">No roles assigned</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {access.roles.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                >
                  {role}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-lg border p-4 space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Permission Sets
          </h4>
          {access.permissionSets.length === 0 ? (
            <p className="text-sm">No permission sets assigned</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {access.permissionSets.map((ps) => (
                <span
                  key={ps}
                  className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                >
                  {ps}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-lg border p-4 space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Total Permissions
          </h4>
          <p className="text-2xl font-bold">{access.permissions.length}</p>
        </div>
      </div>

      <div className="rounded-lg border p-6 space-y-4">
        <h3 className="text-lg font-semibold">Permissions by Module</h3>
        {Object.keys(groupedPermissions).length === 0 ? (
          <p className="text-sm text-muted-foreground">No permissions</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedPermissions).map(([module, perms]) => (
              <div key={module} className="space-y-2">
                <h4 className="text-sm font-medium capitalize">{module}</h4>
                <div className="flex flex-wrap gap-1">
                  {perms.map((perm) => (
                    <span
                      key={perm}
                      className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-mono"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {access.scopes.length > 0 && (
        <div className="rounded-lg border p-6 space-y-4">
          <h3 className="text-lg font-semibold">Scopes</h3>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left font-medium">Type</th>
                  <th className="px-4 py-2 text-left font-medium">Public ID</th>
                </tr>
              </thead>
              <tbody>
                {access.scopes.map((scope, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-4 py-2">{scope.type}</td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {scope.publicId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
