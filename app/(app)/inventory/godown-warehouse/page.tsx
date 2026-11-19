"use client"

import { useMemo, useState } from "react"
import {
  Building2,
  MoreHorizontal,
  Pencil,
  Plus,
  Store,
  ToggleLeft,
  ToggleRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { PageHeader } from "@/components/common/PageHeader"
import { SearchInput } from "@/components/common/SearchInput"
import { StatusFilterSelect } from "@/components/common/StatusFilterSelect"
import { StatusBadge } from "@/components/common/StatusBadge"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { RouteGate } from "@/components/auth/RouteGate"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { PERMISSIONS } from "@/lib/permissions"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"

import { useInventoryScope } from "@/features/inventory/hooks/use-inventory-scope"
import { useGodowns } from "@/features/inventory/hooks/use-godowns"
import { useUpdateGodownStatus } from "@/features/inventory/hooks/use-update-godown-status"
import { InventoryScopeBar } from "@/features/inventory/components/InventoryScopeBar"
import { GodownFormDialog } from "@/features/inventory/components/GodownFormDialog"
import type { GodownResponse } from "@/features/inventory/api/inventory.types"

const GODOWN_TYPE_ITEMS = [
  { value: "ALL", label: "All godowns" },
  { value: "DEFAULT", label: "Default only" },
  { value: "SALESMAN", label: "Salesman only" },
] as const

export default function GodownWarehousePage() {
  return (
    <RouteGate permission={PERMISSIONS.GODOWN.VIEW}>
      <GodownWarehouseContent />
    </RouteGate>
  )
}

function GodownWarehouseContent() {
  const scope = useInventoryScope()
  const { companyUuid, distributorUuid, isDistributorUser } = scope

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [typeFilter, setTypeFilter] = useState("ALL")
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)

  const [createOpen, setCreateOpen] = useState(false)
  const [editingUuid, setEditingUuid] = useState<string | null>(null)
  const [statusTarget, setStatusTarget] = useState<GodownResponse | null>(null)

  const { data, isLoading, error, refetch } = useGodowns(
    companyUuid,
    distributorUuid ?? "",
    {
      q: search || undefined,
      status:
        statusFilter === "ALL"
          ? undefined
          : (statusFilter as "ACTIVE" | "INACTIVE"),
      isDefault: typeFilter === "DEFAULT" ? true : undefined,
      isSalesman: typeFilter === "SALESMAN" ? true : undefined,
      page,
      size,
    },
    { enabled: !!distributorUuid }
  )

  const statusMutation = useUpdateGodownStatus(
    companyUuid,
    distributorUuid ?? ""
  )

  const godowns = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  const columns = useMemo<DataTableColumn<GodownResponse>[]>(
    () => [
      {
        id: "code",
        header: "Code",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm">{row.original.godownCode}</span>
            {row.original.isMain ? (
              <Badge variant="secondary" className="text-[10px]">
                Main
              </Badge>
            ) : null}
          </div>
        ),
      },
      {
        id: "name",
        header: "Godown",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.godownName}</span>
            {row.original.addressLine1 ? (
              <span className="text-xs text-muted-foreground">
                {row.original.addressLine1}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        id: "branch",
        header: "Branch",
        cell: ({ row }) =>
          row.original.branchCode ??
          row.original.distributorBranchCode ??
          "—",
      },
      {
        id: "location",
        header: "City / State",
        cell: ({ row }) =>
          [row.original.city, row.original.state]
            .filter(Boolean)
            .join(", ") || "—",
      },
      {
        id: "flags",
        header: "Flags",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.isDefault ? (
              <Badge variant="outline">Default</Badge>
            ) : null}
            {row.original.isSalesman ? (
              <Badge variant="outline">Salesman</Badge>
            ) : null}
            {!row.original.isDefault && !row.original.isSalesman ? (
              <span className="text-muted-foreground">—</span>
            ) : null}
          </div>
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
          const godown = row.original
          // Distributor admins cannot deactivate the system main godown.
          const showToggle = !(
            isDistributorUser &&
            (godown.isMain || godown.godownCode === "MG01")
          )
          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex size-8 items-center justify-center rounded-md hover:bg-muted"
                aria-label={`Actions for ${godown.godownName}`}
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto min-w-44">
                <PermissionGate permission={PERMISSIONS.GODOWN.UPDATE}>
                  <DropdownMenuItem
                    onClick={() => setEditingUuid(godown.uuid)}
                  >
                    <Pencil className="mr-2 size-4" /> Edit
                  </DropdownMenuItem>
                </PermissionGate>
                {showToggle ? (
                  <>
                    <DropdownMenuSeparator />
                    <PermissionGate permission={PERMISSIONS.GODOWN.STATUS}>
                      <DropdownMenuItem
                        variant={
                          godown.status === "ACTIVE" ? "destructive" : "default"
                        }
                        onClick={() => setStatusTarget(godown)}
                      >
                        {godown.status === "ACTIVE" ? (
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
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [isDistributorUser]
  )

  const createButton = (
    <PermissionGate permission={PERMISSIONS.GODOWN.CREATE}>
      <Button onClick={() => setCreateOpen(true)} disabled={!distributorUuid}>
        <Plus className="mr-2 size-4" /> Create Godown
      </Button>
    </PermissionGate>
  )

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Godown Management"
        description="Warehouses and stock locations for the selected distributor."
        action={createButton}
      />

      <InventoryScopeBar scope={scope} />

      {!scope.hydrated ? null : !distributorUuid ? (
        <ScopeRequired />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              placeholder="Search godown code or name..."
              defaultValue={search}
              onChange={(value) => {
                setSearch(value)
                setPage(0)
              }}
            />
            <StatusFilterSelect
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value)
                setPage(0)
              }}
            />
            <Select
              items={GODOWN_TYPE_ITEMS}
              value={typeFilter}
              onValueChange={(value: string | null) => {
                if (!value) return
                setTypeFilter(value)
                setPage(0)
              }}
            >
              <SelectTrigger aria-label="Filter by godown type" className="w-full sm:w-40">
                <SelectValue placeholder="Godown type" />
              </SelectTrigger>
              <SelectContent>
                {GODOWN_TYPE_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DataTable
            columns={columns}
            data={godowns}
            getRowId={(godown) => godown.uuid}
            isLoading={isLoading}
            error={error}
            onRetry={() => void refetch()}
            empty={{
              icon: Building2,
              title: "No godowns found",
              description:
                search || statusFilter !== "ALL" || typeFilter !== "ALL"
                  ? "Try a different search or clear the filters."
                  : "Create a godown to get started.",
              action:
                !search && statusFilter === "ALL" && typeFilter === "ALL"
                  ? createButton
                  : undefined,
            }}
            pagination={{
              page,
              totalPages,
              totalElements: data?.totalElements,
              onPageChange: setPage,
              pageSize: size,
              onPageSizeChange: (next) => {
                setSize(next)
                setPage(0)
              },
            }}
          />
        </>
      )}

      <GodownFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyUuid={companyUuid}
        distributorUuid={distributorUuid ?? ""}
        isDistributorUser={isDistributorUser}
      />
      <GodownFormDialog
        open={!!editingUuid}
        onOpenChange={(open) => !open && setEditingUuid(null)}
        companyUuid={companyUuid}
        distributorUuid={distributorUuid ?? ""}
        godownUuid={editingUuid}
        isDistributorUser={isDistributorUser}
      />

      <ConfirmDialog
        open={!!statusTarget}
        onOpenChange={(open) => !open && setStatusTarget(null)}
        title={
          statusTarget?.status === "ACTIVE"
            ? "Deactivate godown?"
            : "Activate godown?"
        }
        description={
          statusTarget?.status === "ACTIVE"
            ? `${statusTarget.godownName} will stop accepting stock documents. Deactivation fails while the godown still holds stock — transfer or adjust it out first.`
            : `${statusTarget?.godownName ?? "This godown"} will be available for stock documents again.`
        }
        confirmLabel={
          statusTarget?.status === "ACTIVE" ? "Deactivate" : "Activate"
        }
        variant={statusTarget?.status === "ACTIVE" ? "destructive" : "default"}
        isLoading={statusMutation.isPending}
        onConfirm={() => {
          if (!statusTarget) return
          const action =
            statusTarget.status === "ACTIVE" ? "deactivate" : "activate"
          statusMutation.mutate(
            {
              godownUuid: statusTarget.uuid,
              action,
              version: statusTarget.version,
            },
            {
              onSuccess: () => {
                toast.success(
                  action === "deactivate"
                    ? "Godown deactivated"
                    : "Godown activated"
                )
                setStatusTarget(null)
              },
              onError: (err) => {
                toast.error(
                  getApiErrorMessage(err, "Could not update godown status")
                )
                setStatusTarget(null)
              },
            }
          )
        }}
      />
    </div>
  )
}

function ScopeRequired() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/20 px-6 py-16 text-center">
      <div className="flex size-11 items-center justify-center rounded-full border bg-background">
        <Store className="size-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="font-medium">Select a distributor</p>
        <p className="text-sm text-muted-foreground">
          Godowns are scoped to a distributor. Pick one above to continue.
        </p>
      </div>
    </div>
  )
}
