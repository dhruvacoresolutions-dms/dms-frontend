"use client"

import { useState } from "react"
import { Plus, MoreHorizontal, Pencil, ToggleLeft, ToggleRight, Percent, Upload } from "lucide-react"
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
import { useGstTaxStructures } from "@/features/gst-tax-structures/hooks/use-gst-tax-structures"
import { useUpdateGstTaxStructureStatus } from "@/features/gst-tax-structures/hooks/use-update-gst-tax-structure-status"
import { GstTaxStructureFormDialog } from "@/features/gst-tax-structures/components/GstTaxStructureFormDialog"
import { GstTaxStructureBulkUploadDialog } from "@/features/gst-tax-structures/components/GstTaxStructureBulkUploadDialog"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { RouteGate } from "@/components/auth/RouteGate"
import { PERMISSIONS } from "@/lib/permissions"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"

export default function GstTaxStructuresPage() {
  return (
    <RouteGate permission={PERMISSIONS.PRODUCT.SUPPORTING_MASTER_VIEW}>
      <GstTaxStructuresContent />
    </RouteGate>
  )
}

function GstTaxStructuresContent() {
  const companyUuid = useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editingUuid, setEditingUuid] = useState<string | null>(null)
  const [statusToggle, setStatusToggle] = useState<{ uuid: string; currentStatus: string; version?: number } | null>(null)

  const { data, isLoading, error, refetch } = useGstTaxStructures(companyUuid, {
    search: search || undefined,
    page,
    size: 20,
  })

  const updateStatusMutation = useUpdateGstTaxStructureStatus(companyUuid)

  const taxStructures = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  const formatRate = (v: number | null) =>
    typeof v === "number" ? `${v}%` : "-"

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="GST Tax Structures"
        description="Manage GST tax structures"
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
                <Plus className="mr-2 size-4" /> Create Tax Structure
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <div className="flex items-center gap-2">
        <SearchInput
          placeholder="Search tax structures..."
          defaultValue={search}
          onChange={(v) => { setSearch(v); setPage(0) }}
        />
      </div>

      {isLoading ? <TableSkeleton rows={5} /> : error ? (
        <ErrorState onRetry={refetch} />
      ) : taxStructures.length === 0 ? (
        <EmptyState icon={Percent} title="No tax structures found" description={search ? "Try a different search." : "Create a tax structure to get started."} />
      ) : (
        <>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tax Code</TableHead>
                  <TableHead>Tax Type</TableHead>
                  <TableHead>Primary In</TableHead>
                  <TableHead>Primary Out</TableHead>
                  <TableHead>Apply On</TableHead>
                  <TableHead>Effective From</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {taxStructures.map((t) => (
                  <TableRow key={t.taxStructureUuid}>
                    <TableCell className="font-mono text-sm">{t.taxCode}</TableCell>
                    <TableCell><Badge variant="secondary">{t.taxType}</Badge></TableCell>
                    <TableCell>{formatRate(t.primaryInputRate)}</TableCell>
                    <TableCell>{formatRate(t.primaryOutputRate)}</TableCell>
                    <TableCell>{t.applyOn ?? "-"}</TableCell>
                    <TableCell>{t.effectiveFrom ?? "-"}</TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="cursor-pointer"><MoreHorizontal className="size-4" /></DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-auto min-w-40"
                        >
                          <PermissionGate permission={PERMISSIONS.PRODUCT.SUPPORTING_MASTER_UPDATE}>
                            <DropdownMenuItem onClick={() => setEditingUuid(t.taxStructureUuid)}>
                              <Pencil className="mr-2 size-4" /> Edit
                            </DropdownMenuItem>
                          </PermissionGate>
                          <DropdownMenuSeparator />
                          <PermissionGate permission={PERMISSIONS.PRODUCT.SUPPORTING_MASTER_STATUS}>
                            <DropdownMenuItem
                              variant={
                                t.status === "ACTIVE" ? "destructive" : "default"
                              }
                              onClick={() => setStatusToggle({ uuid: t.taxStructureUuid, currentStatus: t.status, version: t.version })}
                            >
                              {t.status === "ACTIVE" ? <><ToggleLeft className="mr-2 size-4" />{" "} Deactivate</> : <><ToggleRight className="mr-2 size-4" /> Activate</>}
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

      <GstTaxStructureFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyUuid={companyUuid}
      />
      <GstTaxStructureFormDialog
        open={!!editingUuid}
        onOpenChange={(open) => !open && setEditingUuid(null)}
        companyUuid={companyUuid}
        taxStructureUuid={editingUuid}
      />

      <ConfirmDialog
        open={!!statusToggle}
        onOpenChange={(open) => !open && setStatusToggle(null)}
        title="Update Status?"
        description="This will change the tax structure status."
        confirmLabel="Confirm"
        variant="destructive"
        isLoading={updateStatusMutation.isPending}
        onConfirm={() => {
          if (!statusToggle) return
          updateStatusMutation.mutate(
            {
              taxStructureUuid: statusToggle.uuid,
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

      <GstTaxStructureBulkUploadDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        companyUuid={companyUuid}
        onUploadComplete={() => refetch()}
      />
    </div>
  )
}
