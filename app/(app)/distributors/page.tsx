"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Truck,
  Upload,
  History,
} from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/common/SearchInput"
import { StatusFilterSelect } from "@/components/common/StatusFilterSelect"
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
import { PermissionGate } from "@/components/auth/PermissionGate"
import { RouteGate } from "@/components/auth/RouteGate"
import { ExportDropdown } from "@/components/common/ExportDropdown"
import { useDistributors } from "@/features/distributors/hooks/use-distributors"
import { useUpdateDistributorStatus } from "@/features/distributors/hooks/use-update-distributor-status"
import type { DistributorResponse } from "@/features/distributors/api/distributor.types"
import { DistributorFormDialog } from "@/features/distributors/components/DistributorFormDialog"
import { DistributorImportDialog } from "@/features/distributors/components/DistributorImportDialog"
import { DistributorImportHistoryDialog } from "@/features/distributors/components/DistributorImportHistoryDialog"
import { DistributorTypeCombobox } from "@/features/distributors/components/DistributorReferenceCombobox"
import { exportDistributors } from "@/features/distributors/api/distributor.api"
import { PERMISSIONS } from "@/lib/permissions"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"

export default function DistributorsPage() {
  return (
    <RouteGate permission={PERMISSIONS.DISTRIBUTOR.VIEW}>
      <DistributorsContent />
    </RouteGate>
  )
}

function DistributorsContent() {
  const router = useRouter()
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [typeUuid, setTypeUuid] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [editingUuid, setEditingUuid] = useState<string | null>(null)
  const [statusToggle, setStatusToggle] = useState<{
    uuid: string
    currentStatus: string
    version?: number
  } | null>(null)

  const { data, isLoading, error, refetch } = useDistributors(companyUuid, {
    search: search || undefined,
    status:
      statusFilter === "ALL"
        ? undefined
        : (statusFilter as "ACTIVE" | "INACTIVE"),
    distributorTypeUuid: typeUuid ?? undefined,
    page,
    size,
  })

  const updateStatusMutation = useUpdateDistributorStatus(companyUuid)

  const distributors = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const hasActiveFilters =
    search !== "" || statusFilter !== "ALL" || typeUuid !== null

  const columns = useMemo<DataTableColumn<DistributorResponse>[]>(
    () => [
      {
        id: "code",
        header: "Code",
        cell: ({ row }) => (
          <Link
            href={`/distributors/${row.original.distributorUuid}`}
            className="font-mono text-sm text-primary underline-offset-4 hover:underline"
          >
            {row.original.distributorCode}
          </Link>
        ),
      },
      {
        id: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.distributorName}</span>
        ),
      },
      {
        id: "type",
        header: "Type",
        cell: ({ row }) =>
          row.original.distributorTypeName ??
          row.original.distributorTypeCode ??
          "—",
      },
      {
        id: "contact",
        header: "Contact",
        cell: ({ row }) =>
          row.original.primaryContactName ?? row.original.mobileNumber ?? "—",
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
          const d = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer">
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto min-w-40">
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/distributors/${d.distributorUuid}`)
                  }
                >
                  <Eye className="mr-2 size-4" /> View
                </DropdownMenuItem>
                <PermissionGate permission={PERMISSIONS.DISTRIBUTOR.UPDATE}>
                  <DropdownMenuItem
                    onClick={() => setEditingUuid(d.distributorUuid)}
                  >
                    <Pencil className="mr-2 size-4" /> Edit
                  </DropdownMenuItem>
                </PermissionGate>
                <PermissionGate permission={PERMISSIONS.DISTRIBUTOR.STATUS}>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant={d.status === "ACTIVE" ? "destructive" : "default"}
                    onClick={() =>
                      setStatusToggle({
                        uuid: d.distributorUuid,
                        currentStatus: d.status,
                        version: d.version,
                      })
                    }
                  >
                    {d.status === "ACTIVE" ? (
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
    [router]
  )

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Distributors"
        description="Manage distributor records"
        action={
          <div className="flex items-center gap-2">
            <PermissionGate permission={PERMISSIONS.DISTRIBUTOR.IMPORT}>
              <Button variant="outline" onClick={() => setBulkOpen(true)}>
                <Upload className="mr-2 size-4" />
                Bulk Upload
              </Button>
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.DISTRIBUTOR.CREATE}>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 size-4" /> Create Distributor
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          placeholder="Search distributors..."
          defaultValue={search}
          onChange={(v) => {
            setSearch(v)
            setPage(0)
          }}
        />
        <StatusFilterSelect
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v)
            setPage(0)
          }}
        />
        <div className="w-56">
          <DistributorTypeCombobox
            companyUuid={companyUuid}
            value={typeUuid}
            onValueChange={(v) => {
              setTypeUuid(v)
              setPage(0)
            }}
            placeholder="All distributor types"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <PermissionGate permission={PERMISSIONS.DISTRIBUTOR.IMPORT}>
            <Button variant="outline" onClick={() => setHistoryOpen(true)}>
              <History className="mr-2 size-4" />
              Import History
            </Button>
          </PermissionGate>
          <ExportDropdown
            permission={PERMISSIONS.DISTRIBUTOR.EXPORT}
            baseFileName="distributors-export"
            onExport={(format) =>
              exportDistributors(companyUuid, format, {
                search: search || undefined,
                status: statusFilter === "ALL" ? undefined : statusFilter,
                distributorTypeUuid: typeUuid ?? undefined,
              })
            }
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={distributors}
        getRowId={(d) => d.distributorUuid}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        empty={{
          icon: Truck,
          title: "No distributors found",
          description: hasActiveFilters
            ? "Try a different search or clear filters."
            : "Create a distributor to get started.",
          action: !hasActiveFilters ? (
            <PermissionGate permission={PERMISSIONS.DISTRIBUTOR.CREATE}>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 size-4" /> Create Distributor
              </Button>
            </PermissionGate>
          ) : undefined,
        }}
        pagination={{
          page,
          totalPages,
          onPageChange: setPage,
          pageSize: size,
          onPageSizeChange: (s) => {
            setSize(s)
            setPage(0)
          },
        }}
      />

      <DistributorFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyUuid={companyUuid}
      />
      <DistributorFormDialog
        open={!!editingUuid}
        onOpenChange={(open) => !open && setEditingUuid(null)}
        companyUuid={companyUuid}
        distributorUuid={editingUuid}
      />

      <ConfirmDialog
        open={!!statusToggle}
        onOpenChange={(open) => !open && setStatusToggle(null)}
        title="Update Status?"
        description="This will change the distributor status."
        confirmLabel="Confirm"
        variant="destructive"
        isLoading={updateStatusMutation.isPending}
        onConfirm={() => {
          if (!statusToggle) return
          updateStatusMutation.mutate(
            {
              distributorUuid: statusToggle.uuid,
              input: {
                status:
                  statusToggle.currentStatus === "ACTIVE"
                    ? "INACTIVE"
                    : "ACTIVE",
                version: statusToggle.version,
              },
            },
            {
              onSuccess: () => {
                toast.success("Status updated")
                setStatusToggle(null)
              },
              onError: (err) => toast.error(getApiErrorMessage(err, "Failed")),
            }
          )
        }}
      />

      <DistributorImportDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        companyUuid={companyUuid}
        onUploadComplete={() => refetch()}
      />
      <DistributorImportHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        companyUuid={companyUuid}
      />
    </div>
  )
}
