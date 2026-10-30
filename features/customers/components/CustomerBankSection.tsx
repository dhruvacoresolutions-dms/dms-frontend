"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  CheckCircle2,
  FileText,
  Landmark,
  MoreHorizontal,
  Plus,
  Undo2,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { StatusBadge } from "@/components/common/StatusBadge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { usePermission } from "@/hooks/use-permission"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { downloadBlob } from "@/lib/file-download"
import { formatDateTime } from "@/lib/format"
import { PERMISSIONS } from "@/lib/permissions"
import { useAuthStore } from "@/stores/auth-store"
import { downloadCustomerFile } from "../api/customer.api"
import { useCustomerBankEntries } from "../hooks/use-customer-bank-entries"
import { CustomerBankEntryDialog } from "./CustomerBankEntryDialog"
import { CustomerEntryReviewDialog } from "./CustomerEntryReviewDialog"
import type {
  CustomerBankEntry,
  CustomerEntryAction,
} from "../api/customer.types"

const REVIEWABLE: Record<string, CustomerEntryAction[]> = {
  PENDING: ["verify", "reject"],
  VERIFIED: ["revoke"],
  REJECTED: [],
  REVOKED: [],
}

const ACTION_LABELS: Record<CustomerEntryAction, string> = {
  verify: "Verify",
  reject: "Reject",
  revoke: "Revoke",
}

const ACTION_ICONS = {
  verify: CheckCircle2,
  reject: XCircle,
  revoke: Undo2,
} as const

type Props = {
  companyUuid: string
  customerUuid: string
  /** Adding is blocked only for REJECTED customers (not by DRAFT/REWORK). */
  canAdd: boolean
}

/**
 * `GET …/bank-entries` — active entry first, then newest. One PENDING or
 * VERIFIED entry may exist at a time; proof files are downloadable.
 */
export function CustomerBankSection({
  companyUuid,
  customerUuid,
  canAdd,
}: Props) {
  const { data: entries, isLoading, error, refetch } = useCustomerBankEntries(
    companyUuid,
    customerUuid
  )
  const { has } = usePermission()
  const currentUserUuid = useAuthStore((s) => s.session?.user?.userUuid)
  const canReview = has(PERMISSIONS.CUSTOMER.APPROVE)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [review, setReview] = useState<{
    entry: CustomerBankEntry
    action: CustomerEntryAction
  } | null>(null)

  const rows = entries ?? []
  const active = rows.find(
    (entry) => entry.status === "PENDING" || entry.status === "VERIFIED"
  )
  const verified = rows.some(
    (entry) => entry.status === "VERIFIED" && entry.uuid === active?.uuid
  )

  const download = async (fileRef: string, fileName: string) => {
    setDownloading(fileRef)
    try {
      const blob = await downloadCustomerFile(companyUuid, fileRef)
      downloadBlob(blob, fileName)
    } catch (downloadError) {
      toast.error(getApiErrorMessage(downloadError, "Could not download proof"))
    } finally {
      setDownloading(null)
    }
  }

  const columns = useMemo<DataTableColumn<CustomerBankEntry>[]>(
    () => [
      {
        id: "account",
        header: "Account",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-medium">{row.original.bankName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.holderName}
            </p>
          </div>
        ),
      },
      {
        id: "number",
        header: "Number",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="font-mono text-sm">
              {row.original.accountMasked}
            </span>
            {row.original.accountType ? (
              <Badge variant="secondary" className="w-fit">
                {row.original.accountType}
              </Badge>
            ) : null}
          </div>
        ),
      },
      {
        id: "ifsc",
        header: "IFSC / Branch",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-mono text-sm">{row.original.ifsc}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.branch || "—"}
            </p>
          </div>
        ),
      },
      {
        id: "proof",
        header: "Proof",
        cell: ({ row }) =>
          row.original.proofFileUuid ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              disabled={downloading === row.original.proofFileUuid}
              onClick={() =>
                void download(
                  row.original.proofFileUuid as string,
                  `${row.original.bankName}-proof`
                )
              }
            >
              <FileText className="mr-1.5 size-3.5" />
              {downloading === row.original.proofFileUuid
                ? "Downloading..."
                : "View"}
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">None</span>
          ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "created",
        header: "Added",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDateTime(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const entry = row.original
          const actions = REVIEWABLE[entry.status] ?? []
          if (!actions.length) return null
          const isOwn = !!currentUserUuid && entry.createdBy === currentUserUuid
          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="cursor-pointer"
                aria-label="Bank entry actions"
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto min-w-48">
                <PermissionGate permission={PERMISSIONS.CUSTOMER.APPROVE}>
                  {actions.map((action, index) => {
                    const Icon = ACTION_ICONS[action]
                    return (
                      <div key={action}>
                        {index > 0 ? <DropdownMenuSeparator /> : null}
                        <DropdownMenuItem
                          variant={
                            action === "verify" ? "default" : "destructive"
                          }
                          disabled={!canReview || isOwn}
                          title={
                            isOwn
                              ? "You cannot review an entry you created."
                              : undefined
                          }
                          onClick={() => setReview({ entry, action })}
                        >
                          <Icon className="mr-2 size-4" />
                          {ACTION_LABELS[action]}
                        </DropdownMenuItem>
                      </div>
                    )
                  })}
                </PermissionGate>
                {entry.rejectedReason || entry.revokeReason ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled className="max-w-64 text-xs">
                      {entry.rejectedReason ?? entry.revokeReason}
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    // `download` only depends on the company + setter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canReview, currentUserUuid, downloading, companyUuid]
  )

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="size-5" /> Bank account
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {active
              ? `${verified ? "Verified" : "Pending"} · ${active.bankName} ${active.accountMasked}`
              : "No active bank account yet."}
            {rows.length > 1 ? ` · ${rows.length} entries` : ""}
          </p>
        </div>
        <PermissionGate permission={PERMISSIONS.CUSTOMER.MANAGE}>
          <Button
            variant="outline"
            onClick={() => setDialogOpen(true)}
            disabled={!canAdd || !!active}
            title={
              !canAdd
                ? "Bank entries cannot be added to a rejected customer."
                : active
                  ? "Only one pending or verified account is allowed. Reject the active entry first."
                  : undefined
            }
          >
            <Plus className="mr-2 size-4" />
            Add account
          </Button>
        </PermissionGate>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={rows}
          getRowId={(entry) => entry.uuid}
          isLoading={isLoading}
          error={error}
          onRetry={() => void refetch()}
          empty={{
            icon: Landmark,
            title: "No bank account",
            description:
              "Add the settlement account and attach a proof (cancelled cheque or statement).",
          }}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          Approval needs one VERIFIED bank account. Only one pending or verified
          entry is allowed at a time.
        </p>
      </CardContent>

      <CustomerBankEntryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        companyUuid={companyUuid}
        customerUuid={customerUuid}
      />

      <CustomerEntryReviewDialog
        open={!!review}
        onOpenChange={(open) => !open && setReview(null)}
        companyUuid={companyUuid}
        customerUuid={customerUuid}
        kind="bank-entries"
        entryUuid={review?.entry.uuid}
        entryLabel={
          review
            ? `${review.entry.bankName} ${review.entry.accountMasked}`
            : undefined
        }
        action={review?.action ?? null}
      />
    </Card>
  )
}
