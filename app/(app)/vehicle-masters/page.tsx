"use client"

import { useMemo, useState } from "react"
import {
  Plus,
  MoreHorizontal,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Car,
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
import { useVehicleMakes } from "@/features/vehicle-makes/hooks/use-vehicle-makes"
import { useUpdateVehicleMakeStatus } from "@/features/vehicle-makes/hooks/use-update-vehicle-make-status"
import { VehicleMakeFormDialog } from "@/features/vehicle-makes/components/VehicleMakeFormDialog"
import {
  exportVehicleMakes,
  getVehicleMakeImportTemplate,
  uploadVehicleMakeImport,
} from "@/features/vehicle-makes/api/vehicle-make.api"
import { useVehicleModels } from "@/features/vehicle-models/hooks/use-vehicle-models"
import { useUpdateVehicleModelStatus } from "@/features/vehicle-models/hooks/use-update-vehicle-model-status"
import { VehicleModelFormDialog } from "@/features/vehicle-models/components/VehicleModelFormDialog"
import {
  exportVehicleModels,
  getVehicleModelImportTemplate,
  uploadVehicleModelImport,
} from "@/features/vehicle-models/api/vehicle-model.api"
import { useVehicleVariants } from "@/features/vehicle-variants/hooks/use-vehicle-variants"
import { useUpdateVehicleVariantStatus } from "@/features/vehicle-variants/hooks/use-update-vehicle-variant-status"
import { VehicleVariantFormDialog } from "@/features/vehicle-variants/components/VehicleVariantFormDialog"
import {
  exportVehicleVariants,
  getVehicleVariantImportTemplate,
  uploadVehicleVariantImport,
} from "@/features/vehicle-variants/api/vehicle-variant.api"

const SM = PERMISSIONS.PRODUCT

type StatusToggle = {
  uuid: string
  currentStatus: string
  version?: number
}

export default function VehicleMastersPage() {
  return (
    <RouteGate permission={SM.SUPPORTING_MASTER_VIEW}>
      <VehicleMastersContent />
    </RouteGate>
  )
}

function VehicleMastersContent() {
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Vehicle Masters"
        description="Manage vehicle makes, models and variants"
      />
      <Tabs defaultValue="makes">
        <TabsList>
          <TabsTrigger value="makes">Makes</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
        </TabsList>
        <TabsContent value="makes">
          <MakesTab companyUuid={companyUuid} />
        </TabsContent>
        <TabsContent value="models">
          <ModelsTab companyUuid={companyUuid} />
        </TabsContent>
        <TabsContent value="variants">
          <VariantsTab companyUuid={companyUuid} />
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

// ── Makes ──────────────────────────────────────────────────────────────────

function MakesTab({ companyUuid }: { companyUuid: string }) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editingUuid, setEditingUuid] = useState<string | null>(null)
  const [statusToggle, setStatusToggle] = useState<StatusToggle | null>(null)

  const { data, isLoading, error, refetch } = useVehicleMakes(companyUuid, {
    search: search || undefined,
    page,
    size: 20,
  })
  const statusMutation = useUpdateVehicleMakeStatus(companyUuid)

  const makes = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <PermissionGate permission={SM.SUPPORTING_MASTER_CREATE}>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 size-4" /> Create Make
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
          placeholder="Search makes..."
          defaultValue={search}
          onChange={(v) => {
            setSearch(v)
            setPage(0)
          }}
        />
        <div className="ml-auto flex items-center gap-2">
          <ExportDropdown
            permission={SM.SUPPORTING_MASTER_VIEW}
            baseFileName="vehicle-makes-export"
            onExport={(format) =>
              exportVehicleMakes(companyUuid, format, {
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
      ) : makes.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No vehicle makes found"
          description={
            search ? "Try a different search." : "Create a make to get started."
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
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {makes.map((m) => (
                  <TableRow key={m.makeUuid}>
                    <TableCell className="font-mono text-sm">
                      {m.code}
                    </TableCell>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>{m.description ?? "-"}</TableCell>
                    <TableCell>
                      <StatusBadge status={m.status} />
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
                              onClick={() => setEditingUuid(m.makeUuid)}
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
                                m.status === "ACTIVE"
                                  ? "destructive"
                                  : "default"
                              }
                              onClick={() =>
                                setStatusToggle({
                                  uuid: m.makeUuid,
                                  currentStatus: m.status,
                                  version: m.version,
                                })
                              }
                            >
                              {m.status === "ACTIVE" ? (
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
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}

      <VehicleMakeFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyUuid={companyUuid}
      />
      <VehicleMakeFormDialog
        open={!!editingUuid}
        onOpenChange={(open) => !open && setEditingUuid(null)}
        companyUuid={companyUuid}
        makeUuid={editingUuid}
      />
      <ConfirmDialog
        open={!!statusToggle}
        onOpenChange={(open) => !open && setStatusToggle(null)}
        title="Update Status?"
        description="This will change the vehicle make status."
        confirmLabel="Confirm"
        variant="destructive"
        isLoading={statusMutation.isPending}
        onConfirm={() => {
          if (!statusToggle) return
          statusMutation.mutate(
            {
              makeUuid: statusToggle.uuid,
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
        title="Bulk upload vehicle makes"
        description="Upload a CSV or XLSX file to import vehicle makes in bulk."
        dropzoneLabel="Drop vehicle make file here"
        dropzoneDescription="CSV or XLSX up to 10 MB"
        templateFileName="vehicle-make-import-template"
        getTemplate={(format) =>
          getVehicleMakeImportTemplate(companyUuid, format)
        }
        uploadFn={(file) => uploadVehicleMakeImport(companyUuid, file)}
      />
    </div>
  )
}

// ── Models ─────────────────────────────────────────────────────────────────

function ModelsTab({ companyUuid }: { companyUuid: string }) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editingUuid, setEditingUuid] = useState<string | null>(null)
  const [statusToggle, setStatusToggle] = useState<StatusToggle | null>(null)

  const { data, isLoading, error, refetch } = useVehicleModels(companyUuid, {
    search: search || undefined,
    page,
    size: 20,
  })
  const statusMutation = useUpdateVehicleModelStatus(companyUuid)
  const { data: makesData } = useVehicleMakes(companyUuid, {
    size: 100,
    status: "ACTIVE",
  })
  const makeNameByUuid = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of makesData?.content ?? []) map.set(m.makeUuid, m.name)
    return map
  }, [makesData])

  const models = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <PermissionGate permission={SM.SUPPORTING_MASTER_CREATE}>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 size-4" /> Create Model
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
          placeholder="Search models..."
          defaultValue={search}
          onChange={(v) => {
            setSearch(v)
            setPage(0)
          }}
        />
        <div className="ml-auto flex items-center gap-2">
          <ExportDropdown
            permission={SM.SUPPORTING_MASTER_VIEW}
            baseFileName="vehicle-models-export"
            onExport={(format) =>
              exportVehicleModels(companyUuid, format, {
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
      ) : models.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No vehicle models found"
          description={
            search
              ? "Try a different search."
              : "Create a model to get started."
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
                  <TableHead>Make</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((m) => (
                  <TableRow key={m.modelUuid}>
                    <TableCell className="font-mono text-sm">
                      {m.code}
                    </TableCell>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>
                      {m.makeName ??
                        makeNameByUuid.get(m.makeUuid) ??
                        "-"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={m.status} />
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
                              onClick={() => setEditingUuid(m.modelUuid)}
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
                                m.status === "ACTIVE"
                                  ? "destructive"
                                  : "default"
                              }
                              onClick={() =>
                                setStatusToggle({
                                  uuid: m.modelUuid,
                                  currentStatus: m.status,
                                  version: m.version,
                                })
                              }
                            >
                              {m.status === "ACTIVE" ? (
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
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}

      <VehicleModelFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyUuid={companyUuid}
      />
      <VehicleModelFormDialog
        open={!!editingUuid}
        onOpenChange={(open) => !open && setEditingUuid(null)}
        companyUuid={companyUuid}
        modelUuid={editingUuid}
      />
      <ConfirmDialog
        open={!!statusToggle}
        onOpenChange={(open) => !open && setStatusToggle(null)}
        title="Update Status?"
        description="This will change the vehicle model status."
        confirmLabel="Confirm"
        variant="destructive"
        isLoading={statusMutation.isPending}
        onConfirm={() => {
          if (!statusToggle) return
          statusMutation.mutate(
            {
              modelUuid: statusToggle.uuid,
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
        title="Bulk upload vehicle models"
        description="Upload a CSV or XLSX file to import vehicle models in bulk."
        dropzoneLabel="Drop vehicle model file here"
        dropzoneDescription="CSV or XLSX up to 10 MB"
        templateFileName="vehicle-model-import-template"
        getTemplate={(format) =>
          getVehicleModelImportTemplate(companyUuid, format)
        }
        uploadFn={(file) => uploadVehicleModelImport(companyUuid, file)}
      />
    </div>
  )
}

// ── Variants ───────────────────────────────────────────────────────────────

function VariantsTab({ companyUuid }: { companyUuid: string }) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editingUuid, setEditingUuid] = useState<string | null>(null)
  const [statusToggle, setStatusToggle] = useState<StatusToggle | null>(null)

  const { data, isLoading, error, refetch } = useVehicleVariants(companyUuid, {
    search: search || undefined,
    page,
    size: 20,
  })
  const statusMutation = useUpdateVehicleVariantStatus(companyUuid)
  const { data: modelsData } = useVehicleModels(companyUuid, {
    size: 100,
    status: "ACTIVE",
  })
  const modelNameByUuid = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of modelsData?.content ?? []) map.set(m.modelUuid, m.name)
    return map
  }, [modelsData])

  const variants = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <PermissionGate permission={SM.SUPPORTING_MASTER_CREATE}>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 size-4" /> Create Variant
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
          placeholder="Search variants..."
          defaultValue={search}
          onChange={(v) => {
            setSearch(v)
            setPage(0)
          }}
        />
        <div className="ml-auto flex items-center gap-2">
          <ExportDropdown
            permission={SM.SUPPORTING_MASTER_VIEW}
            baseFileName="vehicle-variants-export"
            onExport={(format) =>
              exportVehicleVariants(companyUuid, format, {
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
      ) : variants.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No vehicle variants found"
          description={
            search
              ? "Try a different search."
              : "Create a variant to get started."
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
                  <TableHead>Model</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.map((v) => (
                  <TableRow key={v.variantUuid}>
                    <TableCell className="font-mono text-sm">
                      {v.code}
                    </TableCell>
                    <TableCell className="font-medium">{v.name}</TableCell>
                    <TableCell>
                      {v.modelName ??
                        modelNameByUuid.get(v.modelUuid) ??
                        "-"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={v.status} />
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
                              onClick={() => setEditingUuid(v.variantUuid)}
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
                                v.status === "ACTIVE"
                                  ? "destructive"
                                  : "default"
                              }
                              onClick={() =>
                                setStatusToggle({
                                  uuid: v.variantUuid,
                                  currentStatus: v.status,
                                  version: v.version,
                                })
                              }
                            >
                              {v.status === "ACTIVE" ? (
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
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}

      <VehicleVariantFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyUuid={companyUuid}
      />
      <VehicleVariantFormDialog
        open={!!editingUuid}
        onOpenChange={(open) => !open && setEditingUuid(null)}
        companyUuid={companyUuid}
        variantUuid={editingUuid}
      />
      <ConfirmDialog
        open={!!statusToggle}
        onOpenChange={(open) => !open && setStatusToggle(null)}
        title="Update Status?"
        description="This will change the vehicle variant status."
        confirmLabel="Confirm"
        variant="destructive"
        isLoading={statusMutation.isPending}
        onConfirm={() => {
          if (!statusToggle) return
          statusMutation.mutate(
            {
              variantUuid: statusToggle.uuid,
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
        title="Bulk upload vehicle variants"
        description="Upload a CSV or XLSX file to import vehicle variants in bulk."
        dropzoneLabel="Drop vehicle variant file here"
        dropzoneDescription="CSV or XLSX up to 10 MB"
        templateFileName="vehicle-variant-import-template"
        getTemplate={(format) =>
          getVehicleVariantImportTemplate(companyUuid, format)
        }
        uploadFn={(file) => uploadVehicleVariantImport(companyUuid, file)}
      />
    </div>
  )
}
