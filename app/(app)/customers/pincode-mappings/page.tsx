"use client"

import { useMemo, useState } from "react"
import {
  History,
  MapPinned,
  MoreHorizontal,
  Pencil,
  Plus,
  ToggleLeft,
  ToggleRight,
  Upload,
} from "lucide-react"
import { toast } from "sonner"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SearchInput } from "@/components/common/SearchInput"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { StatusBadge } from "@/components/common/StatusBadge"
import { PageHeader } from "@/components/common/PageHeader"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { ExportDropdown } from "@/components/common/ExportDropdown"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { RouteGate } from "@/components/auth/RouteGate"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { PERMISSIONS } from "@/lib/permissions"
import { useCustomerTerritoryOptions } from "@/features/customers/hooks/use-customer-territory-options"
import { useCustomerPincodeMappings } from "@/features/customers/hooks/use-customer-pincode-mappings"
import { useUpdateCustomerPincodeMappingStatus } from "@/features/customers/hooks/use-update-customer-pincode-mapping-status"
import { CustomerPincodeMappingFormDialog } from "@/features/customers/components/CustomerPincodeMappingFormDialog"
import { CustomerPincodeImportDialog } from "@/features/customers/components/CustomerPincodeImportDialog"
import { CustomerPincodeImportHistoryDialog } from "@/features/customers/components/CustomerPincodeImportHistoryDialog"
import { exportCustomerPincodeMappings } from "@/features/customers/api/customer.api"
import type {
  CustomerPincodeMapping,
  CustomerPincodeMappingStatus,
  CustomerPincodeRecordStatus,
} from "@/features/customers/api/customer.types"

const MAPPING_STATUS_OPTIONS: {
  value: "ALL" | CustomerPincodeMappingStatus
  label: string
}[] = [
  { value: "ALL", label: "All mapping states" },
  { value: "MAPPED", label: "Mapped" },
  { value: "MAPPING_PENDING", label: "Mapping pending" },
  { value: "REVIEW", label: "Needs review" },
]

const RECORD_STATUS_OPTIONS: {
  value: "ALL" | CustomerPincodeRecordStatus
  label: string
}[] = [
  { value: "ALL", label: "All records" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
]

export default function CustomerPincodeMappingsPage() {
  return (
    <RouteGate permission={PERMISSIONS.CUSTOMER.VIEW}>
      <CustomerPincodeMappingsContent />
    </RouteGate>
  )
}

function CustomerPincodeMappingsContent() {
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"

  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<"ALL" | CustomerPincodeMappingStatus>(
    "ALL"
  )
  const [recordStatus, setRecordStatus] = useState<
    "ALL" | CustomerPincodeRecordStatus
  >("ALL")
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<CustomerPincodeMapping | null>(null)
  const [statusToggle, setStatusToggle] =
    useState<CustomerPincodeMapping | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  const { data, isLoading, error, refetch } = useCustomerPincodeMappings(
    companyUuid,
    {
      search: search || undefined,
      status: status === "ALL" ? undefined : status,
      recordStatus: recordStatus === "ALL" ? undefined : recordStatus,
      sort: "pincode,asc",
      page,
      size,
    }
  )

  const { data: territories } = useCustomerTerritoryOptions(companyUuid)

  const statusMutation =
    useUpdateCustomerPincodeMappingStatus(companyUuid)

  const territoryNames = useMemo(() => {
    const map = new Map<string, string>()
    for (const geo of territories ?? []) {
      map.set(geo.geographyUuid, `${geo.name} (${geo.code})`)
    }
    return map
  }, [territories])

  const rows = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const hasActiveFilters =
    search !== "" || status !== "ALL" || recordStatus !== "ALL"

  const columns = useMemo<DataTableColumn<CustomerPincodeMapping>[]>(
    () => [
      {
        id: "pincode",
        header: "Pincode",
        cell: ({ row }) => (
          <span className="font-mono text-sm font-medium">
            {row.original.pincode}
          </span>
        ),
      },
      {
        id: "territory",
        header: "Territory",
        cell: ({ row }) => {
          const { territoryUuid } = row.original
          if (!territoryUuid)
            return <span className="text-muted-foreground">Unassigned</span>
          return (
            <span title={territoryUuid}>
              {territoryNames.get(territoryUuid) ?? (
                <span className="font-mono text-xs">{territoryUuid}</span>
              )}
            </span>
          )
        },
      },
      {
        id: "mappingStatus",
        header: "Mapping",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "recordStatus",
        header: "Record",
        cell: ({ row }) => <StatusBadge status={row.original.recordStatus} />,
      },
      {
        id: "notes",
        header: "Notes",
        cell: ({ row }) => (
          <span className="line-clamp-2 text-sm text-muted-foreground">
            {row.original.notes || "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const mapping = row.original
          const active = mapping.recordStatus === "ACTIVE"
          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="cursor-pointer"
                aria-label="Row actions"
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto min-w-40">
                <PermissionGate permission={PERMISSIONS.CUSTOMER.UPDATE}>
                  <DropdownMenuItem onClick={() => setEditing(mapping)}>
                    <Pencil className="mr-2 size-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant={active ? "destructive" : "default"}
                    onClick={() => setStatusToggle(mapping)}
                  >
                    {active ? (
                      <>
                        <ToggleLeft className="mr-2 size-4" /> Deactivate
                      </>
                    ) : (
                      <>
                        <ToggleRight className="mr-2 size-4" /> Activate
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
    [territoryNames]
  )

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Pincode Mappings"
        description="Map pincodes to territories so new customers inherit coverage automatically."
        action={
          <div className="flex items-center gap-2">
            <PermissionGate permission={PERMISSIONS.CUSTOMER.IMPORT}>
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <Upload className="mr-2 size-4" />
                Bulk Upload
              </Button>
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.CUSTOMER.CREATE}>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 size-4" /> Create Mapping
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          placeholder="Search pincode or notes..."
          defaultValue={search}
          onChange={(v) => {
            setSearch(v)
            setPage(0)
          }}
        />
        <FilterSelect
          value={status}
          onChange={(v) => {
            setStatus(v as "ALL" | CustomerPincodeMappingStatus)
            setPage(0)
          }}
          options={MAPPING_STATUS_OPTIONS}
          ariaLabel="Filter by mapping status"
        />
        <FilterSelect
          value={recordStatus}
          onChange={(v) => {
            setRecordStatus(v as "ALL" | CustomerPincodeRecordStatus)
            setPage(0)
          }}
          options={RECORD_STATUS_OPTIONS}
          ariaLabel="Filter by record status"
        />
        <div className="ml-auto flex items-center gap-2">
          <PermissionGate permission={PERMISSIONS.CUSTOMER.IMPORT}>
            <Button variant="outline" onClick={() => setHistoryOpen(true)}>
              <History className="mr-2 size-4" />
              Import History
            </Button>
          </PermissionGate>
          <ExportDropdown
            permission={PERMISSIONS.CUSTOMER.EXPORT}
            baseFileName="customer-pincode-mappings"
            onExport={(format) =>
              exportCustomerPincodeMappings(companyUuid, format, {
                search: search || undefined,
                status: status === "ALL" ? undefined : status,
                recordStatus:
                  recordStatus === "ALL" ? undefined : recordStatus,
              })
            }
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(m) => m.uuid}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        empty={{
          icon: MapPinned,
          title: "No pincode mappings found",
          description: hasActiveFilters
            ? "Try a different search or clear the filters."
            : "Create a mapping or import a file to get started.",
          action: !hasActiveFilters ? (
            <PermissionGate permission={PERMISSIONS.CUSTOMER.CREATE}>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 size-4" /> Create Mapping
              </Button>
            </PermissionGate>
          ) : undefined,
        }}
        pagination={{
          page,
          totalPages,
          totalElements: data?.totalElements,
          onPageChange: setPage,
          pageSize: size,
          onPageSizeChange: (s) => {
            setSize(s)
            setPage(0)
          },
        }}
      />

      <CustomerPincodeMappingFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyUuid={companyUuid}
      />
      <CustomerPincodeMappingFormDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        companyUuid={companyUuid}
        mapping={editing}
      />

      <ConfirmDialog
        open={!!statusToggle}
        onOpenChange={(open) => !open && setStatusToggle(null)}
        title={
          statusToggle?.recordStatus === "ACTIVE"
            ? "Deactivate mapping?"
            : "Activate mapping?"
        }
        description={
          statusToggle
            ? `Pincode ${statusToggle.pincode} will be ${
                statusToggle.recordStatus === "ACTIVE"
                  ? "excluded from automatic territory resolution"
                  : "used for automatic territory resolution again"
              }.`
            : undefined
        }
        confirmLabel="Confirm"
        variant={
          statusToggle?.recordStatus === "ACTIVE" ? "destructive" : "default"
        }
        isLoading={statusMutation.isPending}
        onConfirm={() => {
          if (!statusToggle) return
          statusMutation.mutate(
            {
              uuid: statusToggle.uuid,
              recordStatus:
                statusToggle.recordStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE",
              version: statusToggle.version,
            },
            {
              onSuccess: () => {
                toast.success("Record status updated")
                setStatusToggle(null)
              },
              onError: (err) =>
                toast.error(getApiErrorMessage(err, "Failed to update status")),
            }
          )
        }}
      />

      <CustomerPincodeImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        companyUuid={companyUuid}
        onUploadComplete={() => void refetch()}
      />
      <CustomerPincodeImportHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        companyUuid={companyUuid}
      />
    </div>
  )
}

function FilterSelect({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string
  onChange: (value: string) => void
  options: readonly { value: string; label: string }[]
  ariaLabel: string
}) {
  return (
    <Select
      items={options}
      value={value}
      onValueChange={(v: string | null) => v && onChange(v)}
    >
      <SelectTrigger aria-label={ariaLabel} className="w-full sm:w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="p-2">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
