"use client"

import { useState } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { ShieldAlert } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/common/PageHeader"
import { TableSkeleton } from "@/components/common/LoadingState"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { useAuditEvents } from "@/features/audit/hooks/use-audit"

export default function RBACAuditPage() {
  const companyUuid = useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const [page, setPage] = useState(0)

  const { data, isLoading, error, refetch } = useAuditEvents(companyUuid, {
    page,
    size: 20,
  })

  const events = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader title="RBAC Audit" description="Audit trail for role-based access control events" />

      {isLoading ? (
        <TableSkeleton rows={10} />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : events.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="No audit events" description="No RBAC events have been recorded yet." />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Target Type</TableHead>
                  <TableHead>Target ID</TableHead>
                  <TableHead>Correlation ID</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.publicId}>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium">
                        {event.eventType}
                      </span>
                    </TableCell>
                    <TableCell>{event.targetType}</TableCell>
                    <TableCell className="font-mono text-xs max-w-[120px] truncate">
                      {event.targetPublicId}
                    </TableCell>
                    <TableCell className="font-mono text-xs max-w-[120px] truncate">
                      {event.correlationId}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(event.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}