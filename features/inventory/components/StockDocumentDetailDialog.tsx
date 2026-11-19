"use client"

import type { ReactNode } from "react"
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  Store,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { StatusBadge } from "@/components/common/StatusBadge"
import { useStockAdjustment } from "../hooks/use-stock-adjustment"
import { useStockTransfer } from "../hooks/use-stock-transfer"
import type { StockDocument } from "../api/inventory.types"
import {
  documentDate,
  formatDate,
  formatDateTime,
  formatQuantity,
  lineMovement,
  totalLineQuantity,
  transactionTypeLabel,
} from "./inventory-format"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  distributorUuid: string
  kind: "adjustment" | "transfer"
  documentUuid?: string | null
  /** Row data from the list so the dialog paints before the detail settles. */
  fallback?: StockDocument | null
  canDecide?: boolean
  onDecisionRequest?: (document: StockDocument, mode: "approve" | "reject") => void
}

export function StockDocumentDetailDialog({
  open,
  onOpenChange,
  companyUuid,
  distributorUuid,
  kind,
  documentUuid,
  fallback,
  canDecide = false,
  onDecisionRequest,
}: Props) {
  const enabled = open && !!documentUuid

  const adjustmentQuery = useStockAdjustment(
    companyUuid,
    distributorUuid,
    kind === "adjustment" ? (documentUuid ?? "") : "",
    { enabled: enabled && kind === "adjustment" }
  )
  const transferQuery = useStockTransfer(
    companyUuid,
    distributorUuid,
    kind === "transfer" ? (documentUuid ?? "") : "",
    { enabled: enabled && kind === "transfer" }
  )

  const query = kind === "adjustment" ? adjustmentQuery : transferQuery
  const document = query.data ?? fallback ?? null

  const isAdjustment = kind === "adjustment"
  const title = isAdjustment ? "Stock adjustment" : "Stock transfer"
  const showDecide = !!document && document.status === "PENDING" && canDecide

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <ClipboardList className="size-4" aria-hidden="true" />
            {title}
            {document ? (
              <span className="font-mono text-xs text-muted-foreground">
                {document.referenceNo}
              </span>
            ) : null}
            {document ? <StatusBadge status={document.status} /> : null}
          </DialogTitle>
          <DialogDescription>
            {isAdjustment
              ? "Manual adjustments post stock only after a company user approves them."
              : "Transfers move quantity between stock types in the same godown."}
          </DialogDescription>
        </DialogHeader>

        {query.isLoading && !document ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Spinner className="size-4" /> Loading document…
          </div>
        ) : !document ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            This document could not be loaded.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {document.status === "PENDING" ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                This document is PENDING. It does not affect stock balances
                until a company user approves it.
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <DetailField
                icon={<CalendarDays className="size-3.5" />}
                label={isAdjustment ? "Adjustment date" : "Transfer date"}
                value={formatDate(documentDate(document))}
              />
              <DetailField
                icon={<Store className="size-3.5" />}
                label="Godown"
                value={
                  document.godownCode && document.godownName
                    ? `${document.godownCode} · ${document.godownName}`
                    : document.godownUuid
                }
              />
              <DetailField
                icon={<FileText className="size-3.5" />}
                label="Document number"
                value={document.documentNumber ?? "—"}
              />
              {isAdjustment ? (
                <>
                  <DetailField
                    label="Transaction type"
                    value={transactionTypeLabel(document.transactionType)}
                  />
                  <DetailField
                    label="Direction"
                    value={
                      document.direction === "OUT"
                        ? "Stock out"
                        : document.direction === "IN"
                          ? "Stock in"
                          : "—"
                    }
                  />
                  <DetailField
                    label="Reason"
                    value={document.reason ?? "—"}
                  />
                </>
              ) : null}
              <DetailField
                label="Branch"
                value={document.branchCode ?? "—"}
              />
              <DetailField
                label="Source"
                value={document.source === "IMPORT" ? "Import" : "Manual"}
              />
              <DetailField
                label="Products"
                value={
                  document.totalProducts ??
                  document.lines?.length ??
                  0
                }
              />
              <DetailField
                label="Total quantity"
                value={formatQuantity(
                  document.totalQuantity ??
                    totalLineQuantity(document.lines)
                )}
              />
            </div>

            {document.remarks ? (
              <div className="rounded-lg border bg-muted/20 px-3 py-2 text-sm">
                <p className="text-xs font-medium text-muted-foreground">
                  Remarks
                </p>
                <p className="mt-0.5 whitespace-pre-wrap">{document.remarks}</p>
              </div>
            ) : null}

            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Product</th>
                    <th className="px-3 py-2 text-left font-medium">Batch</th>
                    <th className="px-3 py-2 text-left font-medium">Type</th>
                    <th className="px-3 py-2 text-right font-medium">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {(document.lines ?? []).map((line, index) => (
                    <tr
                      key={`${line.productUuid}-${index}`}
                      className="border-t"
                    >
                      <td className="px-3 py-2">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {line.productName ??
                              line.productCode ??
                              line.productUuid}
                          </span>
                          {line.productCode ? (
                            <span className="font-mono text-xs text-muted-foreground">
                              {line.productCode}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {line.batchCode ? (
                          <span className="font-mono text-xs">
                            {line.batchCode}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className="font-mono">
                          {lineMovement(line)}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatQuantity(line.quantity)}
                      </td>
                    </tr>
                  ))}
                  {(document.lines ?? []).length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-6 text-center text-sm text-muted-foreground"
                      >
                        No lines on this document.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <DetailField
                label="Created by"
                value={document.createdBy ?? "—"}
              />
              <DetailField
                label="Approved by"
                value={
                  document.approvedBy
                    ? `${document.approvedBy} · ${formatDateTime(document.approvedAt)}`
                    : "—"
                }
              />
              {document.approvedRemarks ? (
                <DetailField
                  label="Approval remarks"
                  value={document.approvedRemarks}
                />
              ) : null}
              {document.status === "REJECTED" ? (
                <>
                  <DetailField
                    label="Rejected by"
                    value={
                      document.rejectedBy
                        ? `${document.rejectedBy} · ${formatDateTime(document.rejectedAt)}`
                        : "—"
                    }
                  />
                  <DetailField
                    label="Rejection remarks"
                    value={
                      document.rejectedRemarks ??
                      document.rejectReason ??
                      "—"
                    }
                  />
                </>
              ) : null}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {showDecide && onDecisionRequest && document ? (
            <>
              <Button
                variant="destructive"
                onClick={() => onDecisionRequest(document, "reject")}
              >
                <XCircle className="mr-2 size-4" /> Reject
              </Button>
              <Button onClick={() => onDecisionRequest(document, "approve")}>
                <CheckCircle2 className="mr-2 size-4" /> Approve
              </Button>
            </>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DetailField({
  label,
  value,
  icon,
}: {
  label: string
  value: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="truncate text-sm font-medium" title={String(value)}>
        {value}
      </span>
    </div>
  )
}
