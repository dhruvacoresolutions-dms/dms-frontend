"use client"

import { useMemo, useState } from "react"
import {
  MoreHorizontal,
  Pencil,
  Plus,
  Star,
  ToggleLeft,
  ToggleRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { PERMISSIONS } from "@/lib/permissions"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { useDistributorBranches } from "../hooks/use-distributor-branches"
import { useUpdateDistributorBranchStatus } from "../hooks/use-update-distributor-branch-status"
import { useSetPrimaryDistributorBranch } from "../hooks/use-set-primary-distributor-branch"
import { DistributorBranchDialog } from "./DistributorBranchDialog"
import type { DistributorBranchResponse } from "../api/distributor.types"

type Props = {
  companyUuid: string
  distributorUuid: string
}

export function DistributorBranchesSection({ companyUuid, distributorUuid }: Props) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<DistributorBranchResponse | null>(null)
  const [statusToggle, setStatusToggle] =
    useState<DistributorBranchResponse | null>(null)
  const [primaryTarget, setPrimaryTarget] =
    useState<DistributorBranchResponse | null>(null)

  const { data, isLoading, error, refetch } = useDistributorBranches(
    companyUuid,
    distributorUuid,
    {
      search: search || undefined,
      status:
        statusFilter === "ALL"
          ? undefined
          : (statusFilter as "ACTIVE" | "INACTIVE"),
      page,
      size,
    }
  )

  const statusMutation = useUpdateDistributorBranchStatus(
    companyUuid,
    distributorUuid
  )
  const primaryMutation = useSetPrimaryDistributorBranch(
    companyUuid,
    distributorUuid
  )

  const branches = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  const columns = useMemo<DataTableColumn<DistributorBranchResponse>[]>(
    () => [
      {
        id: "code",
        header: "Code",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.branchCode}</span>
        ),
      },
      {
        id: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="flex items-center gap-2 font-medium">
            {row.original.branchName}
            {row.original.isPrimary ? (
              <Badge variant="secondary">Primary</Badge>
            ) : null}
          </span>
        ),
      },
      {
        id: "type",
        header: "Type",
        cell: ({ row }) => row.original.branchType ?? "—",
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
          const b = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer">
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto min-w-44">
                <PermissionGate permission={PERMISSIONS.DISTRIBUTOR.UPDATE}>
                  <DropdownMenuItem
                    onClick={() => {
                      setEditing(b)
                      setDialogOpen(true)
                    }}
                  >
                    <Pencil className="mr-2 size-4" /> Edit
                  </DropdownMenuItem>
                </PermissionGate>
                {!b.isPrimary && b.status === "ACTIVE" ? (
                  <PermissionGate permission={PERMISSIONS.DISTRIBUTOR.UPDATE}>
                    <DropdownMenuItem onClick={() => setPrimaryTarget(b)}>
                      <Star className="mr-2 size-4" /> Set Primary
                    </DropdownMenuItem>
                  </PermissionGate>
                ) : null}
                <DropdownMenuSeparator />
                <PermissionGate permission={PERMISSIONS.DISTRIBUTOR.STATUS}>
                  <DropdownMenuItem
                    variant={b.status === "ACTIVE" ? "destructive" : "default"}
                    onClick={() => setStatusToggle(b)}
                  >
                    {b.status === "ACTIVE" ? (
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
    []
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          placeholder="Search branches..."
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
        <div className="ml-auto">
          <PermissionGate permission={PERMISSIONS.DISTRIBUTOR.CREATE}>
            <Button
              onClick={() => {
                setEditing(null)
                setDialogOpen(true)
              }}
            >
              <Plus className="mr-2 size-4" /> Add Branch
            </Button>
          </PermissionGate>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={branches}
        getRowId={(b) => b.branchUuid}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        empty={{
          title: "No branches",
          description:
            search || statusFilter !== "ALL"
              ? "Try a different search or clear filters."
              : "Add the first branch for this distributor.",
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

      <DistributorBranchDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditing(null)
        }}
        companyUuid={companyUuid}
        distributorUuid={distributorUuid}
        branch={editing}
      />

      <ConfirmDialog
        open={!!statusToggle}
        onOpenChange={(open) => !open && setStatusToggle(null)}
        title="Update Status?"
        description="This will change the branch status."
        confirmLabel="Confirm"
        variant="destructive"
        isLoading={statusMutation.isPending}
        onConfirm={() => {
          if (!statusToggle) return
          statusMutation.mutate(
            {
              branchUuid: statusToggle.branchUuid,
              input: {
                status:
                  statusToggle.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
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

      <ConfirmDialog
        open={!!primaryTarget}
        onOpenChange={(open) => !open && setPrimaryTarget(null)}
        title="Set as primary branch?"
        description="The current primary branch will be demoted."
        confirmLabel="Set Primary"
        isLoading={primaryMutation.isPending}
        onConfirm={() => {
          if (!primaryTarget) return
          primaryMutation.mutate(
            { branchUuid: primaryTarget.branchUuid, version: primaryTarget.version },
            {
              onSuccess: () => {
                toast.success("Primary branch updated")
                setPrimaryTarget(null)
              },
              onError: (err) => toast.error(getApiErrorMessage(err, "Failed")),
            }
          )
        }}
      />
    </div>
  )
}
