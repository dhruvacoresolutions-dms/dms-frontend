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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { BulkOperationSummary } from "../api/employee.types"

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
      .map((r) => `${r.username ?? ""}\t${r.temporaryPassword ?? ""}`)
    if (lines.length === 0) {
      toast.error("Nothing to copy")
      return
    }
    void copyText(lines.join("\n"), "__all__")
  }

  return (
    <Dialog open={!!data} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-2xl">
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
        <div className="max-h-80 overflow-y-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Temporary Password</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.results.map((r) => {
                const ok = r.status === "SUCCESS"
                const failureReason =
                  r.message ?? r.error ?? r.errorCode ?? r.reason
                return (
                  <TableRow key={r.employeeUuid}>
                    <TableCell>
                      <span className="flex flex-col">
                        <span className="font-medium">
                          {r.employeeName ?? "—"}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {r.employeeCode ?? r.employeeUuid}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>
                      {r.username ? (
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
                      )}
                    </TableCell>
                    <TableCell>
                      {r.temporaryPassword ? (
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
                      )}
                    </TableCell>
                    <TableCell>
                      {ok ? (
                        <span className="flex flex-col text-sm">
                          <span className="font-medium text-emerald-600">
                            Success
                          </span>
                          {r.emailDispatched != null && (
                            <span className="text-xs text-muted-foreground">
                              Email {r.emailDispatched ? "sent" : "not sent"}
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
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={copyAllCredentials}>
            <Copy className="mr-1.5 size-4" />
            Copy all
          </Button>
          <Button onClick={onClose}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
