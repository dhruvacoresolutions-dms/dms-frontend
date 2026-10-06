"use client"

import { useMemo, useState } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { ShieldAlert } from "lucide-react"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { PageHeader } from "@/components/common/PageHeader"
import { useAuditEvents } from "@/features/audit/hooks/use-audit"
import type { AuditEventResponse } from "@/features/audit/api/audit.types"

export default function RBACAuditPage() {
  const companyUuid = useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)

  const { data, isLoading, error, refetch } = useAuditEvents(companyUuid, {
    page,
    size,
  })

  const events = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  const columns = useMemo<DataTableColumn<AuditEventResponse>[]>(
    () => [
      {
        id: "eventType",
        header: "Event Type",
        cell: ({ row }) => (
          <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium">
            {row.original.eventType}
          </span>
        ),
      },
      {
        id: "targetType",
        header: "Target Type",
        cell: ({ row }) => row.original.targetType,
      },
      {
        id: "targetId",
        header: "Target ID",
        cell: ({ row }) => (
          <span className="font-mono text-xs max-w-[120px] truncate block">
            {row.original.targetPublicId}
          </span>
        ),
      },
      {
        id: "correlationId",
        header: "Correlation ID",
        cell: ({ row }) => (
          <span className="font-mono text-xs max-w-[120px] truncate block">
            {row.original.correlationId}
          </span>
        ),
      },
      {
        id: "timestamp",
        header: "Timestamp",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleString()}
          </span>
        ),
      },
    ],
    []
  )

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader title="RBAC Audit" description="Audit trail for role-based access control events" />

      <DataTable
        columns={columns}
        data={events}
        getRowId={(event) => event.publicId}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        empty={{
          icon: ShieldAlert,
          title: "No audit events",
          description: "No RBAC events have been recorded yet.",
        }}
        pagination={{ page, totalPages, onPageChange: setPage, pageSize: size, onPageSizeChange: (s) => { setSize(s); setPage(0) } }}
      />
    </div>
  )
}
