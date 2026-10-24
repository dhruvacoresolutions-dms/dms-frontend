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
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { formatDateRange } from "@/lib/format"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { useDistributorLicenses } from "../hooks/use-distributor-licenses"
import { useUpdateDistributorLicenseStatus } from "../hooks/use-update-distributor-license-status"
import { DistributorLicenseDialog } from "./DistributorLicenseDialog"
import type {
  DistributorLicenseResponse,
  LicenseType,
} from "../api/distributor.types"

type Props = {
  companyUuid: string
  distributorUuid: string
}

export function DistributorLicensesSection({
  companyUuid,
  distributorUuid,
}: Props) {
  const [licenseType, setLicenseType] = useState<string>("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<DistributorLicenseResponse | null>(
    null
  )
  const [statusToggle, setStatusToggle] =
    useState<DistributorLicenseResponse | null>(null)

  const { data, isLoading, error, refetch } = useDistributorLicenses(
    companyUuid,
    distributorUuid,
    {
      licenseType:
        licenseType === "ALL" ? undefined : (licenseType as LicenseType),
      status:
        statusFilter === "ALL"
          ? undefined
          : (statusFilter as "ACTIVE" | "INACTIVE"),
      page,
      size,
    }
  )

  const statusMutation = useUpdateDistributorLicenseStatus(
    companyUuid,
    distributorUuid
  )

  const licenses = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  const columns = useMemo<DataTableColumn<DistributorLicenseResponse>[]>(
    () => [
      {
        id: "type",
        header: "Type",
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.licenseType}</Badge>
        ),
      },
      {
        id: "number",
        header: "Number",
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            {row.original.licenseNumber}
          </span>
        ),
      },
      {
        id: "authority",
        header: "Authority",
        cell: ({ row }) => row.original.issuingAuthority ?? "—",
      },
      {
        id: "validity",
        header: "Validity",
        cell: ({ row }) => (
          <span className="flex items-center gap-2 text-sm">
            {formatDateRange(row.original.validFrom, row.original.validTo)}
            {row.original.expired ? (
              <Badge variant="destructive">Expired</Badge>
            ) : null}
          </span>
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
          const l = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer">
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto min-w-44">
                <PermissionGate permission={PERMISSIONS.DISTRIBUTOR.UPDATE}>
                  <DropdownMenuItem
                    onClick={() => {
                      setEditing(l)
                      setDialogOpen(true)
                    }}
                  >
                    <Pencil className="mr-2 size-4" /> Edit
                  </DropdownMenuItem>
                </PermissionGate>
                <DropdownMenuSeparator />
                <PermissionGate permission={PERMISSIONS.DISTRIBUTOR.UPDATE}>
                  <DropdownMenuItem
                    variant={l.status === "ACTIVE" ? "destructive" : "default"}
                    onClick={() => setStatusToggle(l)}
                  >
                    {l.status === "ACTIVE" ? (
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
        <Select
          value={licenseType}
          onValueChange={(v: string | null) => {
            setLicenseType(v ?? "ALL")
            setPage(0)
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="License type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            <SelectItem value="DRUG">Drug</SelectItem>
            <SelectItem value="FOOD_TRADE">Food Trade</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
        <StatusFilterSelect
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v)
            setPage(0)
          }}
        />
        <div className="ml-auto">
          <PermissionGate permission={PERMISSIONS.DISTRIBUTOR.UPDATE}>
            <Button
              onClick={() => {
                setEditing(null)
                setDialogOpen(true)
              }}
            >
              <Plus className="mr-2 size-4" /> Add License
            </Button>
          </PermissionGate>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={licenses}
        getRowId={(l) => l.licenseUuid}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        empty={{
          title: "No licenses",
          description:
            licenseType !== "ALL" || statusFilter !== "ALL"
              ? "Try different filters."
              : "Add the first statutory license for this distributor.",
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

      <DistributorLicenseDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditing(null)
        }}
        companyUuid={companyUuid}
        distributorUuid={distributorUuid}
        license={editing}
      />

      <ConfirmDialog
        open={!!statusToggle}
        onOpenChange={(open) => !open && setStatusToggle(null)}
        title="Update Status?"
        description="This will change the license status."
        confirmLabel="Confirm"
        variant="destructive"
        isLoading={statusMutation.isPending}
        onConfirm={() => {
          if (!statusToggle) return
          statusMutation.mutate(
            {
              licenseUuid: statusToggle.licenseUuid,
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
