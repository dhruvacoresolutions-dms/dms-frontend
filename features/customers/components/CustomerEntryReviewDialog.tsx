"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { useReviewCustomerEntry } from "../hooks/use-review-customer-entry"
import type { CustomerEntryAction, CustomerEntryKind } from "../api/customer.types"

const TITLES: Record<CustomerEntryAction, string> = {
  verify: "Verify entry",
  reject: "Reject entry",
  revoke: "Revoke entry",
}

const DESCRIPTIONS: Record<CustomerEntryAction, string> = {
  verify: "The entry becomes VERIFIED and counts towards approval readiness.",
  reject: "The entry becomes REJECTED. The creator must add a new entry.",
  revoke: "The verification is withdrawn and the entry becomes REVOKED.",
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  customerUuid: string
  kind: CustomerEntryKind
  entryUuid?: string | null
  entryLabel?: string
  action: CustomerEntryAction | null
}

/**
 * `verify` / `reject` / `revoke` with an audited reason. The API requires 1–2000
 * characters for reject/revoke and rejects reviewing your own entry (403).
 */
export function CustomerEntryReviewDialog({
  open,
  onOpenChange,
  companyUuid,
  customerUuid,
  kind,
  entryUuid,
  entryLabel,
  action,
}: Props) {
  const mutation = useReviewCustomerEntry(companyUuid)
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setReason("")
      setError(null)
    }
    onOpenChange(next)
  }

  const requiresReason = action === "reject" || action === "revoke"

  const submit = () => {
    if (!action || !entryUuid) return
    const trimmed = reason.trim()
    if (requiresReason && !trimmed) {
      setError("A reason is required")
      return
    }
    if (trimmed.length > 2000) {
      setError("Reason must not exceed 2000 characters")
      return
    }
    setError(null)
    mutation.mutate(
      {
        customerUuid,
        kind,
        entryUuid,
        action,
        reason: requiresReason ? trimmed : undefined,
      },
      {
        onSuccess: () => {
          toast.success(
            action === "verify"
              ? "Entry verified"
              : action === "reject"
                ? "Entry rejected"
                : "Verification revoked"
          )
          handleOpenChange(false)
        },
        onError: (err) => toast.error(getApiErrorMessage(err, "Review failed")),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{action ? TITLES[action] : "Review entry"}</DialogTitle>
          <DialogDescription>
            {entryLabel ? `${entryLabel}. ` : ""}
            {action ? DESCRIPTIONS[action] : undefined}
          </DialogDescription>
        </DialogHeader>

        {requiresReason ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="entry-review-reason" className="text-sm font-medium">
              Reason <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="entry-review-reason"
              rows={3}
              maxLength={2000}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Explain the decision for the audit trail"
              aria-invalid={!!error}
            />
            <p className="text-xs text-muted-foreground">
              {reason.length}/2000 characters
            </p>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
        ) : null}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant={action === "verify" ? "default" : "destructive"}
            onClick={submit}
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? "Updating..."
              : action
                ? TITLES[action]
                : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
