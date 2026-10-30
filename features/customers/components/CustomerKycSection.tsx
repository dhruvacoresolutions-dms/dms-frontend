"use client"

import { useMemo, useState } from "react"
import {
  CheckCircle2,
  MoreHorizontal,
  Plus,
  ShieldCheck,
  Undo2,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { formatDateTime } from "@/lib/format"
import { PERMISSIONS } from "@/lib/permissions"
import { useAuthStore } from "@/stores/auth-store"
import { CUSTOMER_KYC_DOC_TYPES } from "../lib/customer-validation"
import { useCustomerKycEntries } from "../hooks/use-customer-kyc-entries"
import { CustomerKycEntryDialog } from "./CustomerKycEntryDialog"
import { CustomerEntryReviewDialog } from "./CustomerEntryReviewDialog"
import type {
  CustomerEntryAction,
  CustomerKycEntry,
} from "../api/customer.types"

const TYPE_LABELS = new Map(
  CUSTOMER_KYC_DOC_TYPES.map((type) => [type.value, type.label])
)

const REVIEWABLE: Record<string, CustomerEntryAction[]> = {
  PENDING: ["verify", "reject"],
  VERIFIED: ["revoke"],
  REJECTED: [],
  REVOKED: [],
}

type Props = {
  companyUuid: string
  customerUuid: string
  /** Adding is blocked only for REJECTED customers (not by DRAFT/REWORK). */
  canAdd: boolean
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

/**
 * `GET …/kyc-entries` — reviewable entries with holder names. Reviewing needs
 * `CUSTOMER_APPROVE` and the reviewer must not be the creator.
 */
export function CustomerKycSection({
  companyUuid,
  customerUuid,
  canAdd,
}: Props) {
  const {
    data: entries,
    isLoading,
    error,
    refetch,
  } = useCustomerKycEntries(companyUuid, customerUuid)
  const { has } = usePermission()
  const currentUserUuid = useAuthStore((s) => s.session?.user?.userUuid)
  const canReview = has(PERMISSIONS.CUSTOMER.APPROVE)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [review, setReview] = useState<{
    entry: CustomerKycEntry
    action: CustomerEntryAction
  } | null>(null)

  const rows = entries ?? []
  const verified = rows.filter((entry) => entry.status === "VERIFIED").length
  const pending = rows.filter((entry) => entry.status === "PENDING").length

  const columns = useMemo<DataTableColumn<CustomerKycEntry>[]>(
    () => [
      {
        id: "document",
        header: "Document",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-medium">
              {TYPE_LABELS.get(row.original.docType) ?? row.original.docType}
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              {row.original.numberMasked}
            </p>
          </div>
        ),
      },
      {
        id: "holder",
        header: "Holder",
        cell: ({ row }) => {
          const name = [
            row.original.holderFirstName,
            row.original.holderLastName,
          ]
            .filter(Boolean)
            .join(" ")
          return (
            <span className={name ? "" : "text-muted-foreground"}>
              {name || "Not recorded"}
            </span>
          )
        },
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
          if (!actions.length && !entry.documentFileUuid) return null
          const isOwn = !!currentUserUuid && entry.createdBy === currentUserUuid
          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="cursor-pointer"
                aria-label="KYC entry actions"
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
    [canReview, currentUserUuid]
  )

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5" /> KYC documents
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length > 0
              ? `${verified} verified · ${pending} pending of ${rows.length}`
              : "No KYC entries captured yet."}
          </p>
        </div>
        <PermissionGate permission={PERMISSIONS.CUSTOMER.MANAGE}>
          <Button
            variant="outline"
            disabled={!canAdd}
            title={
              canAdd
                ? undefined
                : "KYC entries cannot be added to a rejected customer."
            }
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="mr-2 size-4" /> Add document
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
            icon: ShieldCheck,
            title: "No KYC documents",
            description:
              "Add Aadhaar, PAN or another identity document for verification.",
          }}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          Approval needs at least one VERIFIED entry and no PENDING entries.
          Reviewers cannot verify their own entries.
        </p>
      </CardContent>

      <CustomerKycEntryDialog
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
        kind="kyc-entries"
        entryUuid={review?.entry.uuid}
        entryLabel={
          review
            ? `${TYPE_LABELS.get(review.entry.docType) ?? review.entry.docType} ${review.entry.numberMasked}`
            : undefined
        }
        action={review?.action ?? null}
      />
    </Card>
  )
}
