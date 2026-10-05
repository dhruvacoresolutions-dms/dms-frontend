"use client"

import { useMemo, useState } from "react"
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
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/common/StatusBadge"
import { PageHeader } from "@/components/common/PageHeader"
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
import type { FuelTypeResponse } from "@/features/fuel-types/api/fuel-type.types"
import { useFitmentPositions } from "@/features/fitment-positions/hooks/use-fitment-positions"
import { useUpdateFitmentPositionStatus } from "@/features/fitment-positions/hooks/use-update-fitment-position-status"
import { FitmentPositionFormDialog } from "@/features/fitment-positions/components/FitmentPositionFormDialog"
import {
  exportFitmentPositions,
  getFitmentPositionImportTemplate,
  uploadFitmentPositionImport,
} from "@/features/fitment-positions/api/fitment-position.api"
import { getFitmentPositionId } from "@/features/fitment-positions/api/fitment-position.types"
import type { FitmentPositionResponse } from "@/features/fitment-positions/api/fitment-position.types"
import { useRelationshipTypes } from "@/features/relationship-types/hooks/use-relationship-types"
import { useUpdateRelationshipTypeStatus } from "@/features/relationship-types/hooks/use-update-relationship-type-status"
import { RelationshipTypeFormDialog } from "@/features/relationship-types/components/RelationshipTypeFormDialog"
import {
  exportRelationshipTypes,
  getRelationshipTypeImportTemplate,
  uploadRelationshipTypeImport,
} from "@/features/relationship-types/api/relationship-type.api"
import { getRelationshipTypeId } from "@/features/relationship-types/api/relationship-type.types"
import type { RelationshipTypeResponse } from "@/features/relationship-types/api/relationship-type.types"

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

// ── Fuel Types ─────────────────────────────────────────────────────────────

function FuelTypesTab({ companyUuid }: { companyUuid: string }) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editingUuid, setEditingUuid] = useState<string | null>(null)
  const [statusToggle, setStatusToggle] = useState<StatusToggle | null>(null)

  const { data, isLoading, error, refetch } = useFuelTypes(companyUuid, {
    search: search || undefined,
    page,
    size,
  })
  const statusMutation = useUpdateFuelTypeStatus(companyUuid)

  const fuelTypes = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  const columns = useMemo<DataTableColumn<FuelTypeResponse>[]>(
    () => [
      {
        id: "code",
        header: "Code",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.code}</span>
        ),
      },
      {
        id: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const f = row.original
          const id = getFuelTypeId(f)
          return (
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
          )
        },
      },
    ],
    []
  )

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

      <DataTable
        columns={columns}
        data={fuelTypes}
        getRowId={(f) => getFuelTypeId(f)}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        empty={{
          icon: Wrench,
          title: "No fuel types found",
          description: search
            ? "Try a different search."
            : "Create a fuel type to get started.",
        }}
        pagination={{ page, totalPages, onPageChange: setPage, pageSize: size, onPageSizeChange: (s) => { setSize(s); setPage(0) } }}
      />

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
  const [size, setSize] = useState(10)
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editingUuid, setEditingUuid] = useState<string | null>(null)
  const [statusToggle, setStatusToggle] = useState<StatusToggle | null>(null)

  const { data, isLoading, error, refetch } = useFitmentPositions(companyUuid, {
    search: search || undefined,
    page,
    size,
  })
  const statusMutation = useUpdateFitmentPositionStatus(companyUuid)

  const positions = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  const columns = useMemo<DataTableColumn<FitmentPositionResponse>[]>(
    () => [
      {
        id: "code",
        header: "Code",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.code}</span>
        ),
      },
      {
        id: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const p = row.original
          const id = getFitmentPositionId(p)
          return (
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
          )
        },
      },
    ],
    []
  )

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

      <DataTable
        columns={columns}
        data={positions}
        getRowId={(p) => getFitmentPositionId(p)}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        empty={{
          icon: Wrench,
          title: "No fitment positions found",
          description: search
            ? "Try a different search."
            : "Create a fitment position to get started.",
        }}
        pagination={{ page, totalPages, onPageChange: setPage, pageSize: size, onPageSizeChange: (s) => { setSize(s); setPage(0) } }}
      />

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
  const [size, setSize] = useState(10)
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editingUuid, setEditingUuid] = useState<string | null>(null)
  const [statusToggle, setStatusToggle] = useState<StatusToggle | null>(null)

  const { data, isLoading, error, refetch } = useRelationshipTypes(
    companyUuid,
    {
      search: search || undefined,
      page,
      size,
    }
  )
  const statusMutation = useUpdateRelationshipTypeStatus(companyUuid)

  const types = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  const columns = useMemo<DataTableColumn<RelationshipTypeResponse>[]>(
    () => [
      {
        id: "code",
        header: "Code",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.code}</span>
        ),
      },
      {
        id: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const t = row.original
          const id = getRelationshipTypeId(t)
          return (
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
          )
        },
      },
    ],
    []
  )

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

      <DataTable
        columns={columns}
        data={types}
        getRowId={(t) => getRelationshipTypeId(t)}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        empty={{
          icon: Wrench,
          title: "No relationship types found",
          description: search
            ? "Try a different search."
            : "Create a relationship type to get started.",
        }}
        pagination={{ page, totalPages, onPageChange: setPage, pageSize: size, onPageSizeChange: (s) => { setSize(s); setPage(0) } }}
      />

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
