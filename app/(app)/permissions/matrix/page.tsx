"use client"

import { useState } from "react"
import { ShieldCheck, ShieldAlert } from "lucide-react"
import { SearchInput } from "@/components/common/SearchInput"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/common/PageHeader"
import { LoadingState } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { EmptyState } from "@/components/common/EmptyState"
import { usePermissionMatrix } from "@/features/permissions/hooks/use-permission-matrix"
import { getApiError } from "@/lib/api/api-error"

export default function PermissionMatrixPage() {
  const [search, setSearch] = useState("")
  const { data: matrix, isLoading, error, refetch } = usePermissionMatrix()
  const apiError = getApiError(error)
  const isForbidden = apiError?.code === "ACCESS_DENIED" || apiError?.code === "FORBIDDEN" || (error as unknown as { response?: { status: number } })?.response?.status === 403

  const filtered = matrix?.filter(
    (m) =>
      !search ||
      m.moduleCode.toLowerCase().includes(search.toLowerCase()) ||
      m.moduleName.toLowerCase().includes(search.toLowerCase()) ||
      m.resources.some(
        (r) =>
          r.resourceCode.toLowerCase().includes(search.toLowerCase()) ||
          r.resourceName.toLowerCase().includes(search.toLowerCase()) ||
          r.actions.some((a) => a.permissionCode.toLowerCase().includes(search.toLowerCase()))
      )
  )

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader title="Permission Matrix" description="Visual overview of all permissions organized by module and resource" />

      <div className="flex items-center gap-2">
        <SearchInput
          placeholder="Search modules, resources, permissions..."
          defaultValue={search}
          onChange={(v) => setSearch(v)}
        />
      </div>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        isForbidden ? (
          <EmptyState
            icon={ShieldAlert}
            title="Access denied"
            description="You need PERMISSION_VIEW permission to view the permission matrix. Please login as Platform Administrator (superadmin)."
          />
        ) : (
          <ErrorState message={apiError?.message ?? "Failed to load permission matrix"} onRetry={refetch} />
        )
      ) : !filtered || filtered.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No data" description="No permissions matrix available." />
      ) : (
        <div className="space-y-6">
          {filtered.map((module) => (
            <div key={module.moduleCode} className="rounded-lg border overflow-hidden">
              <div className="bg-muted/50 px-4 py-3 border-b">
                <h3 className="font-semibold">{module.moduleName}</h3>
                <p className="text-xs text-muted-foreground">{module.moduleCode}</p>
              </div>
              <div className="divide-y">
                {module.resources.map((resource) => (
                  <div key={resource.resourceCode} className="px-4 py-3">
                    <p className="text-sm font-medium mb-2">{resource.resourceName}</p>
                    <div className="flex flex-wrap gap-2">
                      {resource.actions.map((action) => (
                        <Badge key={action.permissionCode} variant="secondary" className="font-mono text-xs">
                          {action.action}: {action.permissionCode}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
