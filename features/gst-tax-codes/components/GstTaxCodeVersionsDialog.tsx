"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { StatusBadge } from "@/components/common/StatusBadge"
import { RowActionsMenu } from "@/components/common/RowActionsMenu"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { PERMISSIONS } from "@/lib/permissions"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { useGstTaxCodeVersions } from "../hooks/use-gst-tax-code-versions"
import { usePatchGstTaxCodeVersion } from "../hooks/use-patch-gst-tax-code-version"
import type { GstTaxCodeResponse } from "../api/gst-tax-code.types"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  taxCode: string | null
}

const fmt = (v: number | null | undefined) =>
  typeof v === "number" ? `${v}%` : "—"

export function GstTaxCodeVersionsDialog({
  open,
  onOpenChange,
  companyUuid,
  taxCode,
}: Props) {
  const { data, isLoading, error, refetch } = useGstTaxCodeVersions(
    companyUuid,
    taxCode ?? "",
    { enabled: !!taxCode }
  )
  const patchMutation = usePatchGstTaxCodeVersion(companyUuid)
  const [toggle, setToggle] = useState<GstTaxCodeResponse | null>(null)

  const versions = data ?? []

  const columns = useMemo<DataTableColumn<GstTaxCodeResponse>[]>(
    () => [
      {
        id: "version",
        header: "Version",
        cell: ({ row }) => (
          <span className="font-mono text-sm">v{row.original.version}</span>
        ),
      },
      {
        id: "total",
        header: "Total",
        cell: ({ row }) => fmt(row.original.totalRate),
      },
      { id: "cgst", header: "CGST", cell: ({ row }) => fmt(row.original.cgstRate) },
      { id: "sgst", header: "SGST", cell: ({ row }) => fmt(row.original.sgstRate) },
      { id: "igst", header: "IGST", cell: ({ row }) => fmt(row.original.igstRate) },
      {
        id: "effective",
        header: "Effective",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.effectiveFrom ?? "—"} → {row.original.effectiveTo ?? "—"}
          </span>
        ),
      },
      {
        id: "cessType",
        header: "Cess",
        cell: ({ row }) => row.original.cessType ?? "—",
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
          const v = row.original
          const isActive = v.status === "ACTIVE"
          return (
            <PermissionGate
              permission={PERMISSIONS.PRODUCT.SUPPORTING_MASTER_STATUS}
            >
              <RowActionsMenu
                items={[
                  {
                    key: "status",
                    label: isActive ? "Deactivate" : "Activate",
                    variant: isActive ? "destructive" : "default",
                    onClick: () => setToggle(v),
                  },
                ]}
              />
            </PermissionGate>
          )
        },
      },
    ],
    []
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Tax Code Versions</DialogTitle>
          <DialogDescription>
            {taxCode
              ? `Effective-dated versions of ${taxCode}, newest first.`
              : "Effective-dated versions of the tax code."}
          </DialogDescription>
        </DialogHeader>
        <DataTable
          columns={columns}
          data={versions}
          getRowId={(v) => v.taxVersionUuid}
          isLoading={isLoading}
          error={error}
          onRetry={() => void refetch()}
          wrapperClassName="border-0"
          skeletonRows={3}
          emptyContent={
            <p className="text-sm text-muted-foreground">No versions found.</p>
          }
        />
        <ConfirmDialog
          open={!!toggle}
          onOpenChange={(open) => !open && setToggle(null)}
          title="Change Version Status?"
          description="This will toggle the version ACTIVE/INACTIVE state."
          confirmLabel="Confirm"
          isLoading={patchMutation.isPending}
          onConfirm={() => {
            if (!toggle) return
            patchMutation.mutate(
              {
                versionUuid: toggle.taxVersionUuid,
                taxCode: toggle.taxCode,
                input: {
                  status: toggle.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                },
              },
              {
                onSuccess: () => {
                  toast.success("Version status updated")
                  setToggle(null)
                },
                onError: (err) =>
                  toast.error(getApiErrorMessage(err, "Action failed")),
              }
            )
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
