"use client"

import { useState } from "react"
import {
  Plus,
  MoreHorizontal,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Wrench,
  Upload,
} from "lucide-react"
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
import { StatusBadge } from "@/components/common/StatusBadge"
import { PageHeader } from "@/components/common/PageHeader"
import { TableSkeleton } from "@/components/common/LoadingState"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { BulkImportDialog } from "@/components/common/BulkImportDialog"
import { ExportDropdown } from "@/components/common/ExportDropdown"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { RouteGate } from "@/components/auth/RouteGate"
import { PERMISSIONS } from "@/lib/permissions"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { useFuelTypes } from "@/features/fuel-types/hooks/use-fuel-types"
import { useUpdateFuelTypeStatus } from "@/features/fuel-types/hooks/use-update-fuel-type-status"
import { FuelTypeFormDialog } from "@/features/fuel-types/components/FuelTypeFormDialog"
import {
  exportFuelTypes,
  getFuelTypeImportTemplate,
  uploadFuelTypeImport,
} from "@/features/fuel-types/api/fuel-type.api"
import { getFuelTypeId } from "@/features/fuel-types/api/fuel-type.types"
import { useFitmentPositions } from "@/features/fitment-positions/hooks/use-fitment-positions"
import { useUpdateFitmentPositionStatus } from "@/features/fitment-positions/hooks/use-update-fitment-position-status"
import { FitmentPositionFormDialog } from "@/features/fitment-positions/components/FitmentPositionFormDialog"
import {
  exportFitmentPositions,
  getFitmentPositionImportTemplate,
  uploadFitmentPositionImport,
} from "@/features/fitment-positions/api/fitment-position.api"
import { getFitmentPositionId } from "@/features/fitment-positions/api/fitment-position.types"
import { useRelationshipTypes } from "@/features/relationship-types/hooks/use-relationship-types"
import { useUpdateRelationshipTypeStatus } from "@/features/relationship-types/hooks/use-update-relationship-type-status"
import { RelationshipTypeFormDialog } from "@/features/relationship-types/components/RelationshipTypeFormDialog"
import {
  exportRelationshipTypes,
  getRelationshipTypeImportTemplate,
  uploadRelationshipTypeImport,
} from "@/features/relationship-types/api/relationship-type.api"
import { getRelationshipTypeId } from "@/features/relationship-types/api/relationship-type.types"

const SM = PERMISSIONS.PRODUCT

type StatusToggle = {
  uuid: string
  currentStatus: string
  version?: number
}

export default function SupportMastersPage() {
  return (
    <RouteGate permission={SM.SUPPORTING_MASTER_VIEW}>
      <SupportMastersContent />
    </RouteGate>
  )
}

function SupportMastersContent() {
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Support Masters"
        description="Manage fuel types, fitment positions and relationship types"
      />
      <Tabs defaultValue="fuel-types">
        <TabsList>
          <TabsTrigger value="fuel-types">Fuel Types</TabsTrigger>
          <TabsTrigger value="fitment-positions">Fitment Positions</TabsTrigger>
          <TabsTrigger value="relationship-types">
            Relationship Types
          </TabsTrigger>
        </TabsList>
        <TabsContent value="fuel-types">
          <FuelTypesTab companyUuid={companyUuid} />
        </TabsContent>
        <TabsContent value="fitment-positions">
          <FitmentPositionsTab companyUuid={companyUuid} />
        </TabsContent>
        <TabsContent value="relationship-types">
          <RelationshipTypesTab companyUuid={companyUuid} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number
  totalPages: number
  onPage: (p: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Page {page + 1} of {totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 0}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages - 1}
          onClick={() => onPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

// ── Fuel Types ─────────────────────────────────────────────────────────────

function FuelTypesTab({ companyUuid }: { companyUuid: string }) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editingUuid, setEditingUuid] = useState<string | null>(null)
  const [statusToggle, setStatusToggle] = useState<StatusToggle | null>(null)

  const { data, isLoading, error, refetch } = useFuelTypes(companyUuid, {
    search: search || undefined,
    page,
    size: 20,
  })
  const statusMutation = useUpdateFuelTypeStatus(companyUuid)

  const fuelTypes = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <PermissionGate permission={SM.SUPPORTING_MASTER_CREATE}>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 size-4" /> Create Fuel Type
          </Button>
        </PermissionGate>
        <PermissionGate permission={SM.SUPPORTING_MASTER_IMPORT}>
          <Button variant="outline" onClick={() => setBulkOpen(true)}>
            <Upload className="mr-2 size-4" />
            Bulk Upload
          </Button>
        </PermissionGate>
      </div>

      <div className="flex items-center gap-2">
        <SearchInput
          placeholder="Search fuel types..."
          defaultValue={search}
          onChange={(v) => {
            setSearch(v)
            setPage(0)
          }}
        />
        <div className="ml-auto flex items-center gap-2">
          <ExportDropdown
            permission={SM.SUPPORTING_MASTER_VIEW}
            baseFileName="fuel-types-export"
            onExport={(format) =>
              exportFuelTypes(companyUuid, format, {
                search: search || undefined,
              })
            }
          />
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : fuelTypes.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No fuel types found"
          description={
            search
              ? "Try a different search."
              : "Create a fuel type to get started."
          }
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {fuelTypes.map((f) => {
                  const id = getFuelTypeId(f)
                  return (
                    <TableRow key={id}>
                      <TableCell className="font-mono text-sm">
                        {f.code}
                      </TableCell>
                      <TableCell className="font-medium">{f.name}</TableCell>
                      <TableCell>
                        <StatusBadge status={f.status} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="cursor-pointer">
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-auto min-w-40"
                          >
                            <PermissionGate
                              permission={SM.SUPPORTING_MASTER_UPDATE}
                            >
                              <DropdownMenuItem
                                onClick={() => setEditingUuid(id)}
                              >
                                <Pencil className="mr-2 size-4" /> Edit
                              </DropdownMenuItem>
                            </PermissionGate>
                            <DropdownMenuSeparator />
                            <PermissionGate
                              permission={SM.SUPPORTING_MASTER_STATUS}
                            >
                              <DropdownMenuItem
                                variant={
                                  f.status === "ACTIVE"
                                    ? "destructive"
                                    : "default"
                                }
                                onClick={() =>
                                  setStatusToggle({
                                    uuid: id,
                                    currentStatus: f.status,
                                    version: f.version,
                                  })
                                }
                              >
                                {f.status === "ACTIVE" ? (
                                  <>
                                    <ToggleLeft className="mr-2 size-4" />{" "}
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <ToggleRight className="mr-2 size-4" />{" "}
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                            </PermissionGate>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}

      <FuelTypeFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyUuid={companyUuid}
      />
      <FuelTypeFormDialog
        open={!!editingUuid}
        onOpenChange={(open) => !open && setEditingUuid(null)}
        companyUuid={companyUuid}
        fuelTypeUuid={editingUuid}
      />
      <ConfirmDialog
        open={!!statusToggle}
        onOpenChange={(open) => !open && setStatusToggle(null)}
        title="Update Status?"
        description="This will change the fuel type status."
        confirmLabel="Confirm"
        variant="destructive"
        isLoading={statusMutation.isPending}
        onConfirm={() => {
          if (!statusToggle) return
          statusMutation.mutate(
            {
              fuelTypeUuid: statusToggle.uuid,
              input: {
                status:
                  statusToggle.currentStatus === "ACTIVE"
                    ? "INACTIVE"
                    : "ACTIVE",
                ...(statusToggle.version !== undefined
                  ? { version: statusToggle.version }
                  : {}),
              },
            },
            {
              onSuccess: () => {
                toast.success("Status updated")
                setStatusToggle(null)
              },
              onError: (error) => {
                toast.error(getApiErrorMessage(error, "Failed"))
              },
            }
          )
        }}
      />
      <BulkImportDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onUploadComplete={() => refetch()}
        title="Bulk upload fuel types"
        description="Upload a CSV or XLSX file to import fuel types in bulk."
        dropzoneLabel="Drop fuel type file here"
        dropzoneDescription="CSV or XLSX up to 10 MB"
        templateFileName="fuel-type-import-template"
        getTemplate={(format) =>
          getFuelTypeImportTemplate(companyUuid, format)
        }
        uploadFn={(file) => uploadFuelTypeImport(companyUuid, file)}
      />
    </div>
  )
}

// ── Fitment Positions ──────────────────────────────────────────────────────

function FitmentPositionsTab({ companyUuid }: { companyUuid: string }) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editingUuid, setEditingUuid] = useState<string | null>(null)
  const [statusToggle, setStatusToggle] = useState<StatusToggle | null>(null)

  const { data, isLoading, error, refetch } = useFitmentPositions(companyUuid, {
    search: search || undefined,
    page,
    size: 20,
  })
  const statusMutation = useUpdateFitmentPositionStatus(companyUuid)

  const positions = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <PermissionGate permission={SM.SUPPORTING_MASTER_CREATE}>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 size-4" /> Create Fitment Position
          </Button>
        </PermissionGate>
        <PermissionGate permission={SM.SUPPORTING_MASTER_IMPORT}>
          <Button variant="outline" onClick={() => setBulkOpen(true)}>
            <Upload className="mr-2 size-4" />
            Bulk Upload
          </Button>
        </PermissionGate>
      </div>

      <div className="flex items-center gap-2">
        <SearchInput
          placeholder="Search fitment positions..."
          defaultValue={search}
          onChange={(v) => {
            setSearch(v)
            setPage(0)
          }}
        />
        <div className="ml-auto flex items-center gap-2">
          <ExportDropdown
            permission={SM.SUPPORTING_MASTER_VIEW}
            baseFileName="fitment-positions-export"
            onExport={(format) =>
              exportFitmentPositions(companyUuid, format, {
                search: search || undefined,
              })
            }
          />
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : positions.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No fitment positions found"
          description={
            search
              ? "Try a different search."
              : "Create a fitment position to get started."
          }
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((p) => {
                  const id = getFitmentPositionId(p)
                  return (
                    <TableRow key={id}>
                      <TableCell className="font-mono text-sm">
                        {p.code}
                      </TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>
                        <StatusBadge status={p.status} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="cursor-pointer">
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-auto min-w-40"
                          >
                            <PermissionGate
                              permission={SM.SUPPORTING_MASTER_UPDATE}
                            >
                              <DropdownMenuItem
                                onClick={() => setEditingUuid(id)}
                              >
                                <Pencil className="mr-2 size-4" /> Edit
                              </DropdownMenuItem>
                            </PermissionGate>
                            <DropdownMenuSeparator />
                            <PermissionGate
                              permission={SM.SUPPORTING_MASTER_STATUS}
                            >
                              <DropdownMenuItem
                                variant={
                                  p.status === "ACTIVE"
                                    ? "destructive"
                                    : "default"
                                }
                                onClick={() =>
                                  setStatusToggle({
                                    uuid: id,
                                    currentStatus: p.status,
                                    version: p.version,
                                  })
                                }
                              >
                                {p.status === "ACTIVE" ? (
                                  <>
                                    <ToggleLeft className="mr-2 size-4" />{" "}
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <ToggleRight className="mr-2 size-4" />{" "}
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                            </PermissionGate>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}

      <FitmentPositionFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyUuid={companyUuid}
      />
      <FitmentPositionFormDialog
        open={!!editingUuid}
        onOpenChange={(open) => !open && setEditingUuid(null)}
        companyUuid={companyUuid}
        fitmentPositionUuid={editingUuid}
      />
      <ConfirmDialog
        open={!!statusToggle}
        onOpenChange={(open) => !open && setStatusToggle(null)}
        title="Update Status?"
        description="This will change the fitment position status."
        confirmLabel="Confirm"
        variant="destructive"
        isLoading={statusMutation.isPending}
        onConfirm={() => {
          if (!statusToggle) return
          statusMutation.mutate(
            {
              fitmentPositionUuid: statusToggle.uuid,
              input: {
                status:
                  statusToggle.currentStatus === "ACTIVE"
                    ? "INACTIVE"
                    : "ACTIVE",
                ...(statusToggle.version !== undefined
                  ? { version: statusToggle.version }
                  : {}),
              },
            },
            {
              onSuccess: () => {
                toast.success("Status updated")
                setStatusToggle(null)
              },
              onError: (error) => {
                toast.error(getApiErrorMessage(error, "Failed"))
              },
            }
          )
        }}
      />
      <BulkImportDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onUploadComplete={() => refetch()}
        title="Bulk upload fitment positions"
        description="Upload a CSV or XLSX file to import fitment positions in bulk."
        dropzoneLabel="Drop fitment position file here"
        dropzoneDescription="CSV or XLSX up to 10 MB"
        templateFileName="fitment-position-import-template"
        getTemplate={(format) =>
          getFitmentPositionImportTemplate(companyUuid, format)
        }
        uploadFn={(file) => uploadFitmentPositionImport(companyUuid, file)}
      />
    </div>
  )
}

// ── Relationship Types ─────────────────────────────────────────────────────

function RelationshipTypesTab({ companyUuid }: { companyUuid: string }) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editingUuid, setEditingUuid] = useState<string | null>(null)
  const [statusToggle, setStatusToggle] = useState<StatusToggle | null>(null)

  const { data, isLoading, error, refetch } = useRelationshipTypes(
    companyUuid,
    {
      search: search || undefined,
      page,
      size: 20,
    }
  )
  const statusMutation = useUpdateRelationshipTypeStatus(companyUuid)

  const types = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <PermissionGate permission={SM.SUPPORTING_MASTER_CREATE}>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 size-4" /> Create Relationship Type
          </Button>
        </PermissionGate>
        <PermissionGate permission={SM.SUPPORTING_MASTER_IMPORT}>
          <Button variant="outline" onClick={() => setBulkOpen(true)}>
            <Upload className="mr-2 size-4" />
            Bulk Upload
          </Button>
        </PermissionGate>
      </div>

      <div className="flex items-center gap-2">
        <SearchInput
          placeholder="Search relationship types..."
          defaultValue={search}
          onChange={(v) => {
            setSearch(v)
            setPage(0)
          }}
        />
        <div className="ml-auto flex items-center gap-2">
          <ExportDropdown
            permission={SM.SUPPORTING_MASTER_VIEW}
            baseFileName="relationship-types-export"
            onExport={(format) =>
              exportRelationshipTypes(companyUuid, format, {
                search: search || undefined,
              })
            }
          />
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : types.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No relationship types found"
          description={
            search
              ? "Try a different search."
              : "Create a relationship type to get started."
          }
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {types.map((t) => {
                  const id = getRelationshipTypeId(t)
                  return (
                    <TableRow key={id}>
                      <TableCell className="font-mono text-sm">
                        {t.code}
                      </TableCell>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell>
                        <StatusBadge status={t.status} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="cursor-pointer">
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-auto min-w-40"
                          >
                            <PermissionGate
                              permission={SM.SUPPORTING_MASTER_UPDATE}
                            >
                              <DropdownMenuItem
                                onClick={() => setEditingUuid(id)}
                              >
                                <Pencil className="mr-2 size-4" /> Edit
                              </DropdownMenuItem>
                            </PermissionGate>
                            <DropdownMenuSeparator />
                            <PermissionGate
                              permission={SM.SUPPORTING_MASTER_STATUS}
                            >
                              <DropdownMenuItem
                                variant={
                                  t.status === "ACTIVE"
                                    ? "destructive"
                                    : "default"
                                }
                                onClick={() =>
                                  setStatusToggle({
                                    uuid: id,
                                    currentStatus: t.status,
                                    version: t.version,
                                  })
                                }
                              >
                                {t.status === "ACTIVE" ? (
                                  <>
                                    <ToggleLeft className="mr-2 size-4" />{" "}
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <ToggleRight className="mr-2 size-4" />{" "}
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                            </PermissionGate>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}

      <RelationshipTypeFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyUuid={companyUuid}
      />
      <RelationshipTypeFormDialog
        open={!!editingUuid}
        onOpenChange={(open) => !open && setEditingUuid(null)}
        companyUuid={companyUuid}
        relationshipTypeUuid={editingUuid}
      />
      <ConfirmDialog
        open={!!statusToggle}
        onOpenChange={(open) => !open && setStatusToggle(null)}
        title="Update Status?"
        description="This will change the relationship type status."
        confirmLabel="Confirm"
        variant="destructive"
        isLoading={statusMutation.isPending}
        onConfirm={() => {
          if (!statusToggle) return
          statusMutation.mutate(
            {
              relationshipTypeUuid: statusToggle.uuid,
              input: {
                status:
                  statusToggle.currentStatus === "ACTIVE"
                    ? "INACTIVE"
                    : "ACTIVE",
                ...(statusToggle.version !== undefined
                  ? { version: statusToggle.version }
                  : {}),
              },
            },
            {
              onSuccess: () => {
                toast.success("Status updated")
                setStatusToggle(null)
              },
              onError: (error) => {
                toast.error(getApiErrorMessage(error, "Failed"))
              },
            }
          )
        }}
      />
      <BulkImportDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onUploadComplete={() => refetch()}
        title="Bulk upload relationship types"
        description="Upload a CSV or XLSX file to import relationship types in bulk."
        dropzoneLabel="Drop relationship type file here"
        dropzoneDescription="CSV or XLSX up to 10 MB"
        templateFileName="relationship-type-import-template"
        getTemplate={(format) =>
          getRelationshipTypeImportTemplate(companyUuid, format)
        }
        uploadFn={(file) => uploadRelationshipTypeImport(companyUuid, file)}
      />
    </div>
  )
}
