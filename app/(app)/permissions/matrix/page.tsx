"use client"

import { useState } from "react"
import { ShieldCheck, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/common/PageHeader"
import { LoadingState } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { EmptyState } from "@/components/common/EmptyState"
import { usePermissionMatrix } from "@/features/permissions/hooks/use-permission-matrix"

export default function PermissionMatrixPage() {
  const [search, setSearch] = useState("")
  const { data: matrix, isLoading, error, refetch } = usePermissionMatrix()

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
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search modules, resources, permissions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState onRetry={refetch} />
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