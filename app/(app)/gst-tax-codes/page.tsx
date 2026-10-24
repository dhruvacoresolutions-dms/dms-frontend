"use client"

import { useMemo, useState } from "react"
import {
  Plus,
  MoreHorizontal,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Percent,
  Upload,
  History,
  GitBranch,
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
import { ExportDropdown } from "@/components/common/ExportDropdown"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { RouteGate } from "@/components/auth/RouteGate"
import { PERMISSIONS } from "@/lib/permissions"
import { formatDate } from "@/lib/format"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"
import type { GstTaxCodeResponse } from "@/features/gst-tax-codes/api/gst-tax-code.types"
import { useGstTaxCodes } from "@/features/gst-tax-codes/hooks/use-gst-tax-codes"
import { usePatchGstTaxCodeVersion } from "@/features/gst-tax-codes/hooks/use-patch-gst-tax-code-version"
import { exportGstTaxCodes } from "@/features/gst-tax-codes/api/gst-tax-code.api"
import { GstTaxCodeFormDialog } from "@/features/gst-tax-codes/components/GstTaxCodeFormDialog"
import { GstTaxCodeEditDialog } from "@/features/gst-tax-codes/components/GstTaxCodeEditDialog"
import { GstTaxCodeVersionsDialog } from "@/features/gst-tax-codes/components/GstTaxCodeVersionsDialog"
import { GstTaxCodeImportDialog } from "@/features/gst-tax-codes/components/GstTaxCodeImportDialog"

const SM = PERMISSIONS.PRODUCT

export default function GstTaxCodesPage() {
  return (
    <RouteGate permission={SM.SUPPORTING_MASTER_VIEW}>
      <GstTaxCodesContent />
    </RouteGate>
  )
}

function formatRate(v: number | null | undefined) {
  return typeof v === "number" ? `${v}%` : "-"
}

function GstTaxCodesContent() {
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editing, setEditing] = useState<GstTaxCodeResponse | null>(null)
  const [newVersionFor, setNewVersionFor] = useState<GstTaxCodeResponse | null>(
    null
  )
  const [versionsFor, setVersionsFor] = useState<string | null>(null)
  const [statusToggle, setStatusToggle] = useState<GstTaxCodeResponse | null>(
    null
  )

  const { data, isLoading, error, refetch } = useGstTaxCodes(companyUuid, {
    search: search || undefined,
    status:
      statusFilter === "ALL"
        ? undefined
        : (statusFilter as "ACTIVE" | "INACTIVE"),
    page,
    size,
  })

  const patchMutation = usePatchGstTaxCodeVersion(companyUuid)

  const taxCodes = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  const columns = useMemo<DataTableColumn<GstTaxCodeResponse>[]>(
    () => [
      {
        id: "taxCode",
        header: "Tax Code",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.taxCode}</span>
        ),
      },
      {
        id: "totalRate",
        header: "Total",
        cell: ({ row }) => formatRate(row.original.totalRate),
      },
      {
        id: "cgstRate",
        header: "CGST",
        cell: ({ row }) => formatRate(row.original.cgstRate),
      },
      {
        id: "sgstRate",
        header: "SGST",
        cell: ({ row }) => formatRate(row.original.sgstRate),
      },
      {
        id: "igstRate",
        header: "IGST",
        cell: ({ row }) => formatRate(row.original.igstRate),
      },
      {
        id: "effectiveFrom",
        header: "Effective From",
        cell: ({ row }) => formatDate(row.original.effectiveFrom),
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
          return (
            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer">
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto min-w-44">
                <PermissionGate permission={SM.SUPPORTING_MASTER_UPDATE}>
                  <DropdownMenuItem onClick={() => setEditing(t)}>
                    <Pencil className="mr-2 size-4" /> Edit
                  </DropdownMenuItem>
                </PermissionGate>
                <PermissionGate permission={SM.SUPPORTING_MASTER_CREATE}>
                  <DropdownMenuItem onClick={() => setNewVersionFor(t)}>
                    <GitBranch className="mr-2 size-4" /> New Version
                  </DropdownMenuItem>
                </PermissionGate>
                <PermissionGate permission={SM.SUPPORTING_MASTER_VIEW}>
                  <DropdownMenuItem onClick={() => setVersionsFor(t.taxCode)}>
                    <History className="mr-2 size-4" /> Versions
                  </DropdownMenuItem>
                </PermissionGate>
                <DropdownMenuSeparator />
                <PermissionGate permission={SM.SUPPORTING_MASTER_STATUS}>
                  <DropdownMenuItem
                    variant={t.status === "ACTIVE" ? "destructive" : "default"}
                    onClick={() => setStatusToggle(t)}
                  >
                    {t.status === "ACTIVE" ? (
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
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="GST Tax Codes"
        description="Manage versioned GST tax codes referenced by product GST mappings"
        action={
          <div className="flex items-center gap-2">
            <PermissionGate permission={SM.SUPPORTING_MASTER_IMPORT}>
              <Button variant="outline" onClick={() => setBulkOpen(true)}>
                <Upload className="mr-2 size-4" />
                Bulk Upload
              </Button>
            </PermissionGate>
            <PermissionGate permission={SM.SUPPORTING_MASTER_CREATE}>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 size-4" /> Create Tax Code
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          placeholder="Search tax codes..."
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
        <div className="ml-auto flex items-center gap-2">
          <ExportDropdown
            permission={SM.SUPPORTING_MASTER_VIEW}
            baseFileName="gst-tax-codes-export"
            onExport={(format) =>
              exportGstTaxCodes(companyUuid, format, {
                search: search || undefined,
                status: statusFilter === "ALL" ? undefined : statusFilter,
              })
            }
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={taxCodes}
        getRowId={(t) => t.taxVersionUuid}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        empty={{
          icon: Percent,
          title: "No tax codes found",
          description:
            search || statusFilter !== "ALL"
              ? "Try a different search or clear filters."
              : "Create a tax code to get started.",
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

      <GstTaxCodeFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyUuid={companyUuid}
        mode="create"
      />
      <GstTaxCodeFormDialog
        open={!!newVersionFor}
        onOpenChange={(open) => !open && setNewVersionFor(null)}
        companyUuid={companyUuid}
        mode="new-version"
        source={newVersionFor}
      />
      <GstTaxCodeEditDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        companyUuid={companyUuid}
        source={editing}
      />
      <GstTaxCodeVersionsDialog
        open={!!versionsFor}
        onOpenChange={(open) => !open && setVersionsFor(null)}
        companyUuid={companyUuid}
        taxCode={versionsFor}
      />
      <GstTaxCodeImportDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        companyUuid={companyUuid}
        onUploadComplete={() => refetch()}
      />

      <ConfirmDialog
        open={!!statusToggle}
        onOpenChange={(open) => !open && setStatusToggle(null)}
        title="Update Status?"
        description="This changes the status of the current tax code version."
        confirmLabel="Confirm"
        variant="destructive"
        isLoading={patchMutation.isPending}
        onConfirm={() => {
          if (!statusToggle) return
          patchMutation.mutate(
            {
              versionUuid: statusToggle.taxVersionUuid,
              taxCode: statusToggle.taxCode,
              input: {
                status:
                  statusToggle.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
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
    </div>
  )
}
