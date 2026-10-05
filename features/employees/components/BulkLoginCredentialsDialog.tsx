"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import type {
  BulkLoginResultEntry,
  BulkOperationSummary,
} from "../api/employee.types"

type Props = {
  /** Null hides the dialog */
  data: BulkOperationSummary | null
  onClose: () => void
}

/**
 * One-time view of generated login credentials after bulk enable.
 * Lists every employee in the result with username / temporary password
 * and per-cell plus copy-all actions.
 */
export function BulkLoginCredentialsDialog({ data, onClose }: Props) {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null)

  const hasCopyable = (data?.results ?? []).some(
    (r) => r.username || r.temporaryPassword
  )

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      toast.success("Copied to clipboard")
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1500)
    } catch {
      toast.error("Copy failed")
    }
  }

  const copyAllCredentials = () => {
    const lines = (data?.results ?? [])
      .filter((r) => r.username || r.temporaryPassword)
      .map(
        (r) =>
          `${r.employeeName ?? r.employeeCode ?? r.employeeUuid} - username: ${r.username ?? "—"}, temporary password:${r.temporaryPassword ?? "—"}`
      )
    if (lines.length === 0) {
      toast.error("Nothing to copy")
      return
    }
    void copyText(lines.join("\n"), "__all__")
  }

  /** Human-friendly label for SKIPPED_* codes (raw codes are not shown). */
  const skippedLabel = (status: string): string => {
    if (status === "SKIPPED_ALREADY_ENABLED")
      return "Skipped — login already enabled"
    if (status.startsWith("SKIPPED_")) {
      const rest = status
        .slice("SKIPPED_".length)
        .toLowerCase()
        .replace(/_/g, " ")
      return `Skipped — ${rest}`
    }
    return "Skipped"
  }

  const columns = React.useMemo<DataTableColumn<BulkLoginResultEntry>[]>(
    () => [
      {
        id: "employee",
        header: "Employee",
        cell: ({ row }) => {
          const r = row.original
          return (
            <span className="flex flex-col">
              <span className="font-medium">{r.employeeName ?? "—"}</span>
              <span className="font-mono text-xs text-muted-foreground">
                {r.employeeCode ?? r.employeeUuid}
              </span>
            </span>
          )
        },
      },
      {
        id: "username",
        header: "Username",
        cell: ({ row }) => {
          const r = row.original
          return r.username ? (
            <span className="flex items-center gap-1 font-mono text-sm">
              {r.username}
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Copy username ${r.username}`}
                onClick={() =>
                  void copyText(r.username as string, `u:${r.employeeUuid}`)
                }
              >
                {copiedKey === `u:${r.employeeUuid}` ? (
                  <Check className="size-3.5 text-emerald-600" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </Button>
            </span>
          ) : (
            "—"
          )
        },
      },
      {
        id: "password",
        header: "Temporary Password",
        cell: ({ row }) => {
          const r = row.original
          return r.temporaryPassword ? (
            <span className="flex items-center gap-1 font-mono text-sm">
              {r.temporaryPassword}
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Copy temporary password for ${r.employeeName ?? r.employeeCode ?? r.employeeUuid}`}
                onClick={() =>
                  void copyText(
                    r.temporaryPassword as string,
                    `p:${r.employeeUuid}`
                  )
                }
              >
                {copiedKey === `p:${r.employeeUuid}` ? (
                  <Check className="size-3.5 text-emerald-600" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </Button>
            </span>
          ) : (
            "—"
          )
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const r = row.original
          const ok = r.status === "SUCCESS"
          const statusCode = r.status ?? ""
          const isSkipped = statusCode.startsWith("SKIPPED")
          const failureReason = r.message ?? r.error ?? r.errorCode ?? r.reason
          // Skipped rows (e.g. SKIPPED_ALREADY_ENABLED): show the
          // human message in destructive red instead of the raw code.
          const skippedDetail = r.error ?? r.errorCode ?? r.reason
          return ok ? (
            <span className="flex flex-col text-sm">
              <span className="font-medium text-emerald-600">Success</span>
              {r.emailDispatched != null && (
                <span className="text-xs text-muted-foreground">
                  Email {r.emailDispatched ? "sent" : "not sent"}
                </span>
              )}
            </span>
          ) : isSkipped ? (
            <span className="flex flex-col text-sm">
              <span className="font-medium text-destructive">
                {r.message ?? skippedLabel(statusCode)}
              </span>
              {skippedDetail && skippedDetail !== r.message && (
                <span className="text-xs text-muted-foreground">
                  {skippedDetail}
                </span>
              )}
            </span>
          ) : (
            <span className="flex flex-col text-sm">
              <span className="font-medium text-destructive">
                {r.status ?? "Failed"}
              </span>
              {failureReason && (
                <span className="text-xs text-muted-foreground">
                  {failureReason}
                </span>
              )}
            </span>
          )
        },
      },
    ],
    [copiedKey]
  )

  return (
    <Dialog open={!!data} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-7xl min-w-4xl">
        <DialogHeader>
          <DialogTitle>
            Logins enabled — {data?.successful ?? 0} succeeded
            {(data?.failed ?? 0) > 0 && `, ${data?.failed} failed`}
            {(data?.skipped ?? 0) > 0 && `, ${data?.skipped} skipped`}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Share these temporary passwords with the employees. They are shown
          only once.
        </p>
        <DataTable
          columns={columns}
          data={data?.results ?? []}
          getRowId={(r) => r.employeeUuid}
          empty={{
            title: "No results",
            description: "No credential results to show.",
          }}
          wrapperClassName="max-h-80 overflow-y-auto"
        />
        <div className="flex justify-end gap-2">
          {hasCopyable && (
            <Button variant="outline" onClick={copyAllCredentials}>
              <Copy className="mr-1.5 size-4" />
              Copy all
            </Button>
          )}
          <Button onClick={onClose}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
