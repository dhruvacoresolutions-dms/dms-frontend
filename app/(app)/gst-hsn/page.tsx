"use client"

import { useState } from "react"
import { Plus, MoreHorizontal, Pencil, ToggleLeft, ToggleRight, ReceiptText, Upload } from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/common/SearchInput"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/common/StatusBadge"
import { PageHeader } from "@/components/common/PageHeader"
import { TableSkeleton } from "@/components/common/LoadingState"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { useGstHsns } from "@/features/gst-hsn/hooks/use-gst-hsns"
import { useUpdateGstHsnStatus } from "@/features/gst-hsn/hooks/use-update-gst-hsn-status"
import { GstHsnFormDialog } from "@/features/gst-hsn/components/GstHsnFormDialog"
import { GstHsnBulkUploadDialog } from "@/features/gst-hsn/components/GstHsnBulkUploadDialog"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { RouteGate } from "@/components/auth/RouteGate"
import { PERMISSIONS } from "@/lib/permissions"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"

export default function GstHsnPage() {
  return (
    <RouteGate permission={PERMISSIONS.PRODUCT.SUPPORTING_MASTER_VIEW}>
      <GstHsnContent />
    </RouteGate>
  )
}

function GstHsnContent() {
  const companyUuid = useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editingUuid, setEditingUuid] = useState<string | null>(null)
  const [statusToggle, setStatusToggle] = useState<{ uuid: string; currentStatus: string; version?: number } | null>(null)

  const { data, isLoading, error, refetch } = useGstHsns(companyUuid, {
    search: search || undefined,
    page,
    size: 20,
  })

  const updateStatusMutation = useUpdateGstHsnStatus(companyUuid)

  const hsns = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="GST HSN"
        description="Manage GST HSN codes"
        action={
          <div className="flex items-center gap-2">
            <PermissionGate permission={PERMISSIONS.PRODUCT.SUPPORTING_MASTER_IMPORT}>
              <Button variant="outline" onClick={() => setBulkOpen(true)}>
                <Upload className="mr-2 size-4" />
                Bulk Upload
              </Button>
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.PRODUCT.SUPPORTING_MASTER_CREATE}>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 size-4" /> Create HSN
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <div className="flex items-center gap-2">
        <SearchInput
          placeholder="Search GST HSN..."
          defaultValue={search}
          onChange={(v) => { setSearch(v); setPage(0) }}
        />
      </div>

      {isLoading ? <TableSkeleton rows={5} /> : error ? (
        <ErrorState onRetry={refetch} />
      ) : hsns.length === 0 ? (
        <EmptyState icon={ReceiptText} title="No GST HSN found" description={search ? "Try a different search." : "Create an HSN entry to get started."} />
      ) : (
        <>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>HSN Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Product Type</TableHead>
                  <TableHead>Effective From</TableHead>
                  <TableHead>Effective To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {hsns.map((h) => (
                  <TableRow key={h.hsnUuid}>
                    <TableCell className="font-mono text-sm">{h.hsnCode}</TableCell>
                    <TableCell className="font-medium">{h.description ?? "-"}</TableCell>
                    <TableCell>{h.gstProductType ? <Badge variant="secondary">{h.gstProductType}</Badge> : "-"}</TableCell>
                    <TableCell>{h.effectiveFrom ?? "-"}</TableCell>
                    <TableCell>{h.effectiveTo ?? "-"}</TableCell>
                    <TableCell><StatusBadge status={h.status} /></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="cursor-pointer"><MoreHorizontal className="size-4" /></DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-auto min-w-40"
                        >
                          <PermissionGate permission={PERMISSIONS.PRODUCT.SUPPORTING_MASTER_UPDATE}>
                            <DropdownMenuItem onClick={() => setEditingUuid(h.hsnUuid)}>
                              <Pencil className="mr-2 size-4" /> Edit
                            </DropdownMenuItem>
                          </PermissionGate>
                          <DropdownMenuSeparator />
                          <PermissionGate permission={PERMISSIONS.PRODUCT.SUPPORTING_MASTER_STATUS}>
                            <DropdownMenuItem
                              variant={
                                h.status === "ACTIVE" ? "destructive" : "default"
                              }
                              onClick={() => setStatusToggle({ uuid: h.hsnUuid, currentStatus: h.status, version: h.version })}
                            >
                              {h.status === "ACTIVE" ? <><ToggleLeft className="mr-2 size-4" />{" "} Deactivate</> : <><ToggleRight className="mr-2 size-4" /> Activate</>}
                            </DropdownMenuItem>
                          </PermissionGate>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}

      <GstHsnFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyUuid={companyUuid}
      />
      <GstHsnFormDialog
        open={!!editingUuid}
        onOpenChange={(open) => !open && setEditingUuid(null)}
        companyUuid={companyUuid}
        hsnUuid={editingUuid}
      />

      <ConfirmDialog
        open={!!statusToggle}
        onOpenChange={(open) => !open && setStatusToggle(null)}
        title="Update Status?"
        description="This will change the GST HSN status."
        confirmLabel="Confirm"
        variant="destructive"
        isLoading={updateStatusMutation.isPending}
        onConfirm={() => {
          if (!statusToggle) return
          updateStatusMutation.mutate(
            {
              hsnUuid: statusToggle.uuid,
              input: {
                status: statusToggle.currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                ...(typeof statusToggle.version === "number" ? { version: statusToggle.version } : {}),
              },
            },
            {
              onSuccess: () => { toast.success("Status updated"); setStatusToggle(null) },
              onError: (error) => { toast.error(getApiErrorMessage(error, "Failed")) },
            }
          )
        }}
      />

      <GstHsnBulkUploadDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        companyUuid={companyUuid}
        onUploadComplete={() => refetch()}
      />
    </div>
  )
}
