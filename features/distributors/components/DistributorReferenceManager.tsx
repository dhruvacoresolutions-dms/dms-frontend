"use client"

import { useMemo, useState } from "react"
import {
  MoreHorizontal,
  Pencil,
  Plus,
  ToggleLeft,
  ToggleRight,
} from "lucide-react"
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
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { PERMISSIONS } from "@/lib/permissions"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { useDistributorReferences } from "../hooks/use-distributor-references"
import { useUpdateDistributorReferenceStatus } from "../hooks/use-update-distributor-reference-status"
import { DistributorReferenceFormDialog } from "./DistributorReferenceFormDialog"
import type {
  DistributorReferenceKind,
  DistributorReferenceResponse,
} from "../api/distributor-reference.types"

type Props = {
  companyUuid: string
  kind: DistributorReferenceKind
  singular: string
}

export function DistributorReferenceManager({ companyUuid, kind, singular }: Props) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<DistributorReferenceResponse | null>(
    null
  )
  const [statusToggle, setStatusToggle] =
    useState<DistributorReferenceResponse | null>(null)

  const { data, isLoading, error, refetch } = useDistributorReferences(
    companyUuid,
    kind,
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

  const statusMutation = useUpdateDistributorReferenceStatus(companyUuid, kind)

  const rows = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const lower = singular.toLowerCase()

  const columns = useMemo<DataTableColumn<DistributorReferenceResponse>[]>(
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
        id: "description",
        header: "Description",
        cell: ({ row }) => row.original.description ?? "—",
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
          const r = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer">
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto min-w-44">
                <PermissionGate permission={PERMISSIONS.DISTRIBUTOR.MASTER_UPDATE}>
                  <DropdownMenuItem
                    onClick={() => {
                      setEditing(r)
                      setDialogOpen(true)
                    }}
                  >
                    <Pencil className="mr-2 size-4" /> Edit
                  </DropdownMenuItem>
                </PermissionGate>
                <DropdownMenuSeparator />
                <PermissionGate permission={PERMISSIONS.DISTRIBUTOR.MASTER_STATUS}>
                  <DropdownMenuItem
                    variant={r.status === "ACTIVE" ? "destructive" : "default"}
                    onClick={() => setStatusToggle(r)}
                  >
                    {r.status === "ACTIVE" ? (
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
          placeholder={`Search ${lower}s...`}
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
          <PermissionGate permission={PERMISSIONS.DISTRIBUTOR.MASTER_CREATE}>
            <Button
              onClick={() => {
                setEditing(null)
                setDialogOpen(true)
              }}
            >
              <Plus className="mr-2 size-4" /> Create {singular}
            </Button>
          </PermissionGate>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(r) => r.uuid}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        empty={{
          title: `No ${lower}s found`,
          description:
            search || statusFilter !== "ALL"
              ? "Try a different search or clear filters."
              : `Create a ${lower} to get started.`,
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

      <DistributorReferenceFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditing(null)
        }}
        companyUuid={companyUuid}
        kind={kind}
        singular={singular}
        reference={editing}
      />

      <ConfirmDialog
        open={!!statusToggle}
        onOpenChange={(open) => !open && setStatusToggle(null)}
        title="Update Status?"
        description={`This will change the ${lower} status.`}
        confirmLabel="Confirm"
        variant="destructive"
        isLoading={statusMutation.isPending}
        onConfirm={() => {
          if (!statusToggle) return
          statusMutation.mutate(
            {
              uuid: statusToggle.uuid,
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
    </div>
  )
}
