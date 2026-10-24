"use client"

import { useCallback, useMemo, useState } from "react"
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
  ShieldAlert,
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
import type { DistributorListResponse } from "@/features/distributors/api/distributor.types"
import { DistributorFormDialog } from "@/features/distributors/components/DistributorFormDialog"
import { DistributorImportDialog } from "@/features/distributors/components/DistributorImportDialog"
import { DistributorImportHistoryDialog } from "@/features/distributors/components/DistributorImportHistoryDialog"
import { DistributorTypeCombobox } from "@/features/distributors/components/DistributorReferenceCombobox"
import { exportDistributors } from "@/features/distributors/api/distributor.api"
import { PERMISSIONS } from "@/lib/permissions"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useBulkDeactivateDistributors } from "@/features/distributors/hooks/use-bulk-deactivate-distributors"
import { useBulkLoginDistributors } from "@/features/distributors/hooks/use-bulk-login-distributors"
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
  const [loginStatus, setLoginStatus] = useState("ALL")
  const [selected, setSelected] = useState<
    Record<string, DistributorListResponse>
  >({})
  const [bulkDeactivateOpen, setBulkDeactivateOpen] = useState(false)
  const [bulkLoginOpen, setBulkLoginOpen] = useState(false)
  const [bulkResults, setBulkResults] = useState<Awaited<
    ReturnType<
      typeof import("@/features/distributors/api/distributor.api").bulkDeactivateDistributors
    >
  > | null>(null)
  const [bulkResultNames, setBulkResultNames] = useState<
    Record<string, DistributorListResponse>
  >({})
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
    loginStatus:
      loginStatus === "ALL"
        ? undefined
        : (loginStatus as "NONE" | "ACTIVE" | "DISABLED"),
    page,
    size,
  })

  const distributors = useMemo(() => data?.content ?? [], [data?.content])
  const totalPages = data?.totalPages ?? 0
  const updateStatusMutation = useUpdateDistributorStatus(companyUuid)
  const bulkDeactivateMutation = useBulkDeactivateDistributors(companyUuid)
  const bulkLoginMutation = useBulkLoginDistributors(companyUuid)
  const selectedUuids = [...new Set(Object.keys(selected))]
  const pageSelected =
    distributors.length > 0 &&
    distributors.every((d) => selected[d.distributorUuid])
  const setPageSelection = useCallback(
    (checked: boolean) => {
      setSelected((current) => {
        const next = { ...current }
        if (checked) {
          for (const item of distributors) {
            if (Object.keys(next).length >= 100) break
            next[item.distributorUuid] = item
          }
        } else
          for (const item of distributors) delete next[item.distributorUuid]
        return next
      })
    },
    [distributors]
  )
  const toggleSelection = useCallback(
    (item: DistributorListResponse, checked: boolean) => {
      setSelected((current) => {
        const next = { ...current }
        if (checked && Object.keys(next).length < 100)
          next[item.distributorUuid] = item
        else delete next[item.distributorUuid]
        return next
      })
    },
    []
  )

  const hasActiveFilters =
    search !== "" ||
    statusFilter !== "ALL" ||
    typeUuid !== null ||
    loginStatus !== "ALL"

  const columns = useMemo<DataTableColumn<DistributorListResponse>[]>(
    () => [
      {
        id: "select",
        header: (
          <Checkbox
            aria-label="Select all distributors on this page"
            checked={pageSelected}
            onCheckedChange={(checked) => setPageSelection(checked === true)}
          />
        ),
        className: "w-10",
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select ${row.original.distributorName}`}
            checked={!!selected[row.original.distributorUuid]}
            disabled={
              !selected[row.original.distributorUuid] &&
              selectedUuids.length >= 100
            }
            onCheckedChange={(checked) =>
              toggleSelection(row.original, checked === true)
            }
          />
        ),
      },
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
        id: "loginStatus",
        header: "Login Status",
        cell: ({ row }) => {
          const status = row.original.loginStatus
          return status ? (
            <StatusBadge
              status={status}
              label={
                status === "NONE"
                  ? "No Login"
                  : status === "ACTIVE"
                    ? "Active"
                    : "Disabled"
              }
              className={
                status === "NONE"
                  ? "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  : status === "ACTIVE"
                    ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
                    : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
              }
            />
          ) : (
            "—"
          )
        },
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
    [
      router,
      selected,
      selectedUuids.length,
      pageSelected,
      setPageSelection,
      toggleSelection,
    ]
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
            setSelected({})
            setPage(0)
          }}
        />
        <StatusFilterSelect
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v)
            setSelected({})
            setPage(0)
          }}
        />
        <Select
          value={loginStatus}
          onValueChange={(value) => {
            setLoginStatus(value ?? "ALL")
            setSelected({})
            setPage(0)
          }}
        >
          <SelectTrigger className="w-44" aria-label="Filter by login status">
            <SelectValue placeholder="All login statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All login statuses</SelectItem>
            <SelectItem value="NONE">No Login</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="DISABLED">Disabled</SelectItem>
          </SelectContent>
        </Select>
        <div className="w-56">
          <DistributorTypeCombobox
            companyUuid={companyUuid}
            value={typeUuid}
            onValueChange={(v) => {
              setTypeUuid(v)
              setSelected({})
              setPage(0)
            }}
            placeholder="All distributor types"
          />
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {selectedUuids.length}/100 selected
          </span>
          <PermissionGate permission={PERMISSIONS.DISTRIBUTOR.STATUS}>
            <Button
              variant="outline"
              disabled={
                !selectedUuids.length || bulkDeactivateMutation.isPending
              }
              onClick={() => setBulkDeactivateOpen(true)}
            >
              <ToggleLeft className="mr-2 size-4" />
              Bulk Deactivate
            </Button>
          </PermissionGate>
          <PermissionGate
            permission={PERMISSIONS.DISTRIBUTOR.LOGIN_BULK_CREDENTIALS}
          >
            <Button
              variant="outline"
              disabled={!selectedUuids.length || bulkLoginMutation.isPending}
              onClick={() => setBulkLoginOpen(true)}
            >
              <ShieldAlert className="mr-2 size-4" />
              Download Login Credentials
            </Button>
          </PermissionGate>
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

      <ConfirmDialog
        open={bulkDeactivateOpen}
        onOpenChange={setBulkDeactivateOpen}
        title={`Deactivate ${selectedUuids.length} distributors?`}
        description="Their associated login access will also be disabled. Reactivating a distributor will not re-enable login access automatically."
        confirmLabel="Deactivate selected"
        variant="destructive"
        isLoading={bulkDeactivateMutation.isPending}
        onConfirm={() =>
          bulkDeactivateMutation.mutate(
            { distributorUuids: selectedUuids },
            {
              onSuccess: (result) => {
                setBulkResultNames(selected)
                setBulkResults(result)
                setSelected({})
                setBulkDeactivateOpen(false)
                if (result.failed || result.skipped)
                  toast.warning(
                    `${result.successful} deactivated, ${result.skipped} skipped, ${result.failed} failed`
                  )
                else
                  toast.success(`${result.successful} distributors deactivated`)
              },
              onError: (error) =>
                toast.error(
                  getApiErrorMessage(error, "Bulk deactivation failed")
                ),
            }
          )
        }
      />
      <ConfirmDialog
        open={bulkLoginOpen}
        onOpenChange={setBulkLoginOpen}
        title={`Generate credentials for ${selectedUuids.length} distributors?`}
        description="This can create or re-enable distributor logins. The downloaded file contains sensitive temporary credentials; handle and share it securely. First login requires a password change."
        confirmLabel="Generate and download"
        isLoading={bulkLoginMutation.isPending}
        onConfirm={() =>
          bulkLoginMutation.mutate(
            { distributorUuids: selectedUuids },
            {
              onSuccess: (summary) => {
                setBulkLoginOpen(false)
                setSelected({})
                toast.success(
                  `Credential file downloaded · ${summary.total ?? selectedUuids.length} processed, ${summary.created ?? 0} created, ${summary.enabled ?? 0} enabled, ${summary.skipped ?? 0} skipped, ${summary.failed ?? 0} failed`
                )
              },
              onError: (error) =>
                toast.error(
                  getApiErrorMessage(error, "Credential download failed")
                ),
            }
          )
        }
      />
      <Dialog
        open={!!bulkResults}
        onOpenChange={(open) => {
          if (!open) {
            setBulkResults(null)
            setBulkResultNames({})
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk deactivation results</DialogTitle>
            <DialogDescription>
              {bulkResults?.total ?? 0} processed ·{" "}
              {bulkResults?.successful ?? 0} deactivated ·{" "}
              {bulkResults?.skipped ?? 0} skipped · {bulkResults?.failed ?? 0}{" "}
              failed
            </DialogDescription>
          </DialogHeader>
          <ul className="max-h-72 space-y-2 overflow-y-auto text-sm">
            {bulkResults?.results.map((result) => (
              <li
                key={result.distributorUuid}
                className="flex justify-between gap-4 border-b pb-2"
              >
                <span>
                  {bulkResultNames[result.distributorUuid]?.distributorName ??
                    result.distributorCode ??
                    result.distributorUuid}
                </span>
                <span className="text-muted-foreground">
                  {result.result}
                  {result.message ? ` · ${result.message}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
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
