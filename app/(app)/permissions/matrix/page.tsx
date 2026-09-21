"use client"

import { useState } from "react"
import { ShieldCheck, ShieldAlert } from "lucide-react"
import { SearchInput } from "@/components/common/SearchInput"
import { PageHeader } from "@/components/common/PageHeader"
import { LoadingState } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { EmptyState } from "@/components/common/EmptyState"
import { usePermissionMatrix } from "@/features/permissions/hooks/use-permission-matrix"
import { PermissionMatrixTable } from "@/features/permissions/components/PermissionMatrixTable"
import { getApiError } from "@/lib/api/api-error"
import { RouteGate } from "@/components/auth/RouteGate"
import { PERMISSIONS } from "@/lib/permissions"

export default function PermissionMatrixPage() {
  return (
    <RouteGate permission={PERMISSIONS.PERMISSION.VIEW}>
      <PermissionMatrixContent />
    </RouteGate>
  )
}

function PermissionMatrixContent() {
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
        <PermissionMatrixTable matrix={filtered} />
      )}
    </div>
  )
}
