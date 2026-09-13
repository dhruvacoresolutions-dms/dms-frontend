"use client"

import { useState } from "react"
import { ShieldCheck, ShieldAlert } from "lucide-react"
import { SearchInput } from "@/components/common/SearchInput"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/common/PageHeader"
import { TableSkeleton } from "@/components/common/LoadingState"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { usePermissions } from "@/features/permissions/hooks/use-permissions"
import { formatModuleLabel } from "@/features/permissions/utils/permission.utils"
import { getApiError } from "@/lib/api/api-error"

export default function PermissionsPage() {
  const [search, setSearch] = useState("")
  const { data: permissions, isLoading, error, refetch } = usePermissions()
  const apiError = getApiError(error)
  const isForbidden = apiError?.code === "ACCESS_DENIED" || apiError?.code === "FORBIDDEN" || (error as unknown as { response?: { status: number } })?.response?.status === 403

  const filtered = permissions?.filter(
    (p) =>
      !search ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.resourceCode.toLowerCase().includes(search.toLowerCase()) ||
      (p.actionCode ?? "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader title="Permissions" description="View all system permissions" />

      <div className="flex items-center gap-2">
        <SearchInput
          placeholder="Search permissions..."
          defaultValue={search}
          onChange={(v) => setSearch(v)}
        />
      </div>

      {isLoading ? (
        <TableSkeleton rows={10} />
      ) : error ? (
        isForbidden ? (
          <EmptyState
            icon={ShieldAlert}
            title="Access denied"
            description="You need PERMISSION_VIEW permission to view permissions. Please login as Platform Administrator (superadmin) or contact your administrator."
          />
        ) : (
          <ErrorState message={apiError?.message ?? "Failed to load permissions"} onRetry={refetch} />
        )
      ) : !filtered || filtered.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No permissions found" description="No permissions match your search." />
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((perm) => (
                <TableRow key={perm.code}>
                  <TableCell className="font-mono text-sm">{perm.code}</TableCell>
                  <TableCell>{perm.name}</TableCell>
                  <TableCell><Badge variant="secondary">{formatModuleLabel(perm.resourceCode)}</Badge></TableCell>
                  <TableCell><span className="capitalize">{perm.actionCode ?? "—"}</span></TableCell>
                  <TableCell><Badge variant={perm.status === "ACTIVE" ? "default" : "outline"}>{perm.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
