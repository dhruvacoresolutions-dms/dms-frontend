"use client"

import { useState } from "react"
import { Plus, MoreHorizontal, Pencil, ToggleLeft, ToggleRight, MapPin, Upload } from "lucide-react"
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
import { useGeographies } from "@/features/geographies/hooks/use-geographies"
import { useUpdateGeographyStatus } from "@/features/geographies/hooks/use-update-geography-status"
import { GeographyFormDialog } from "@/features/geographies/components/GeographyFormDialog"
import { GeographyBulkUploadDialog } from "@/features/geographies/components/GeographyBulkUploadDialog"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { RouteGate } from "@/components/auth/RouteGate"
import { ExportDropdown } from "@/components/common/ExportDropdown"
import { exportGeographies } from "@/features/geographies/api/geography.api"
import { PERMISSIONS } from "@/lib/permissions"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"

export default function GeographiesPage() {
  return (
    <RouteGate permission={PERMISSIONS.GEOGRAPHY.VIEW}>
      <GeographiesContent />
    </RouteGate>
  )
}

function GeographiesContent() {
  const companyUuid = useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editingUuid, setEditingUuid] = useState<string | null>(null)
  const [statusToggle, setStatusToggle] = useState<{ uuid: string; currentStatus: string } | null>(null)

  const { data, isLoading, error, refetch } = useGeographies(companyUuid, {
    search: search || undefined,
    page,
    size: 20,
  })

  const updateStatusMutation = useUpdateGeographyStatus(companyUuid)

  const geographies = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Geographies"
        description="Manage geographical hierarchy"
        action={
          <div className="flex items-center gap-2">
            <ExportDropdown
              permission={PERMISSIONS.GEOGRAPHY.EXPORT}
              baseFileName="geographies-export"
              onExport={(format) => exportGeographies(companyUuid, format)}
            />
            <PermissionGate permission={PERMISSIONS.GEOGRAPHY.IMPORT}>
              <Button variant="outline" onClick={() => setBulkOpen(true)}>
                <Upload className="mr-2 size-4" />
                Bulk Upload
              </Button>
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.GEOGRAPHY.CREATE}>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 size-4" /> Create Geography
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <div className="flex items-center gap-2">
        <SearchInput
          placeholder="Search geographies..."
          defaultValue={search}
          onChange={(v) => { setSearch(v); setPage(0) }}
        />
      </div>

      {isLoading ? <TableSkeleton rows={5} /> : error ? (
        <ErrorState onRetry={refetch} />
      ) : geographies.length === 0 ? (
        <EmptyState icon={MapPin} title="No geographies found" description={search ? "Try a different search." : "Create a geography to get started."} />
      ) : (
        <>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {geographies.map((g) => (
                  <TableRow key={g.geographyUuid}>
                    <TableCell className="font-mono text-sm">{g.code}</TableCell>
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell><Badge variant="secondary">{g.type}</Badge></TableCell>
                    <TableCell>{g.parentName ?? "-"}</TableCell>
                    <TableCell><StatusBadge status={g.status} /></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="cursor-pointer"><MoreHorizontal className="size-4" /></DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-auto min-w-40"
                        >
                          <PermissionGate permission={PERMISSIONS.GEOGRAPHY.UPDATE}>
                            <DropdownMenuItem onClick={() => setEditingUuid(g.geographyUuid)}>
                              <Pencil className="mr-2 size-4" /> Edit
                            </DropdownMenuItem>
                          </PermissionGate>
                          <DropdownMenuSeparator />
                          <PermissionGate permission={PERMISSIONS.GEOGRAPHY.UPDATE}>
                            <DropdownMenuItem
                              variant={
                                g.status === "ACTIVE" ? "destructive" : "default"
                              }
                              onClick={() => setStatusToggle({ uuid: g.geographyUuid, currentStatus: g.status })}
                            >
                              {g.status === "ACTIVE" ? <><ToggleLeft className="mr-2 size-4" />{" "} Deactivate</> : <><ToggleRight className="mr-2 size-4" /> Activate</>}
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

      <GeographyFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyUuid={companyUuid}
      />
      <GeographyFormDialog
        open={!!editingUuid}
        onOpenChange={(open) => !open && setEditingUuid(null)}
        companyUuid={companyUuid}
        geographyUuid={editingUuid}
      />

      <ConfirmDialog
        open={!!statusToggle}
        onOpenChange={(open) => !open && setStatusToggle(null)}
        title="Update Status?"
        description="This will change the geography status."
        confirmLabel="Confirm"
        variant="destructive"
        isLoading={updateStatusMutation.isPending}
        onConfirm={() => {
          if (!statusToggle) return
          updateStatusMutation.mutate(
            { geographyUuid: statusToggle.uuid, input: { status: statusToggle.currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE" } },
            {
              onSuccess: () => { toast.success("Status updated"); setStatusToggle(null) },
              onError: (error) => { toast.error(getApiErrorMessage(error, "Failed")) },
            }
          )
        }}
      />

      <GeographyBulkUploadDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        companyUuid={companyUuid}
        onUploadComplete={() => refetch()}
      />
    </div>
  )
}
