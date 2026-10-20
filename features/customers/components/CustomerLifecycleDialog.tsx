"use client"

import { useState } from "react"
import {
  BadgeCheck,
  CheckCircle2,
  CircleOff,
  Power,
  RotateCcw,
  Send,
  XCircle,
  type LucideIcon,
} from "lucide-react"
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
import { StatusBadge } from "@/components/common/StatusBadge"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { useCustomerLifecycleAction } from "../hooks/use-customer-lifecycle-action"
import type {
  CustomerLifecycleAction,
  CustomerLifecycleStatus,
  CustomerSource,
} from "../api/customer.types"

type LifecycleActionMeta = {
  action: CustomerLifecycleAction
  label: string
  description: string
  requiresReason?: boolean
  destructive?: boolean
  icon: LucideIcon
}

const ACTION_META: Record<CustomerLifecycleAction, LifecycleActionMeta> = {
  submit: {
    action: "submit",
    label: "Submit for verification",
    description: "Sends the customer for KYC and master-data verification.",
    icon: Send,
  },
  verify: {
    action: "verify",
    label: "Verify",
    description: "Marks the submitted customer as verified.",
    icon: BadgeCheck,
  },
  approve: {
    action: "approve",
    label: "Approve & activate",
    description: "Approves the verified customer and activates the outlet.",
    icon: CheckCircle2,
  },
  reject: {
    action: "reject",
    label: "Reject",
    description: "Rejects the customer. A reason is required.",
    requiresReason: true,
    destructive: true,
    icon: XCircle,
  },
  rework: {
    action: "rework",
    label: "Send back for rework",
    description: "Returns the customer to the owner for corrections.",
    requiresReason: true,
    icon: RotateCcw,
  },
  deactivate: {
    action: "deactivate",
    label: "Deactivate",
    description: "Deactivates the customer. Identifiers are released.",
    destructive: true,
    icon: CircleOff,
  },
  activate: {
    action: "activate",
    label: "Activate",
    description: "Reactivates the customer and reclaims its identifiers.",
    icon: Power,
  },
}

/**
 * Lifecycle transitions permitted for a status. Mirrors
 * `CustomerService.target` — anything not listed here is rejected by the API.
 */
export function lifecycleActionsFor(
  status: CustomerLifecycleStatus
): LifecycleActionMeta[] {
  switch (status) {
    case "DRAFT":
    case "REWORK":
      return [ACTION_META.submit]
    case "SUBMITTED":
      return [ACTION_META.verify, ACTION_META.reject, ACTION_META.rework]
    case "VERIFIED":
      return [ACTION_META.approve, ACTION_META.reject, ACTION_META.rework]
    case "ACTIVE":
      return [ACTION_META.deactivate]
    case "INACTIVE":
      return [ACTION_META.activate]
    default:
      return []
  }
}

export function lifecycleActionMeta(action: CustomerLifecycleAction) {
  return ACTION_META[action]
}

type CustomerLifecycleDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  customer: {
    uuid: string
    lifecycleStatus: CustomerLifecycleStatus
    source: CustomerSource
    version: number
  } | null
  action: CustomerLifecycleAction | null
  onSuccess?: () => void
}

export function CustomerLifecycleDialog({
  open,
  onOpenChange,
  companyUuid,
  customer,
  action,
  onSuccess,
}: CustomerLifecycleDialogProps) {
  const [reason, setReason] = useState("")
  const [touched, setTouched] = useState(false)
  const mutation = useCustomerLifecycleAction(companyUuid)

  const meta = action ? ACTION_META[action] : null
  const requiresReason = !!meta?.requiresReason
  const reasonError =
    touched && requiresReason && reason.trim().length === 0
      ? "A reason is required for this action."
      : null

  const handleOpenChange = (next: boolean) => {
    if (mutation.isPending) return
    if (!next) {
      setReason("")
      setTouched(false)
    }
    onOpenChange(next)
  }

  const handleConfirm = () => {
    if (!customer || !action || !meta) return
    setTouched(true)
    if (requiresReason && reason.trim().length === 0) return

    mutation.mutate(
      {
        customerUuid: customer.uuid,
        action,
        input: {
          version: customer.version,
          reason: reason.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success(successMessage(action, customer.source))
          setReason("")
          setTouched(false)
          onOpenChange(false)
          onSuccess?.()
        },
        onError: (error) =>
          toast.error(getApiErrorMessage(error, "Lifecycle action failed")),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {meta?.icon ? <meta.icon className="size-4" /> : null}
            {meta?.label ?? "Update status"}
          </DialogTitle>
          <DialogDescription>
            {meta?.description ??
              "Apply a lifecycle transition to this customer."}
          </DialogDescription>
        </DialogHeader>

        {customer ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Current status</span>
            <StatusBadge status={customer.lifecycleStatus} />
          </div>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="customer-lifecycle-reason"
            className="text-sm font-medium"
          >
            Reason{" "}
            {requiresReason ? (
              <span className="text-destructive">*</span>
            ) : (
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            )}
          </label>
          <Textarea
            id="customer-lifecycle-reason"
            rows={3}
            maxLength={2000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder={
              requiresReason
                ? "Explain why this customer is being sent back..."
                : "Add a note for the audit trail (optional)"
            }
            aria-invalid={!!reasonError}
          />
          {reasonError ? (
            <p className="text-xs text-destructive">{reasonError}</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant={meta?.destructive ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Processing..." : (meta?.label ?? "Confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function successMessage(
  action: CustomerLifecycleAction,
  source: CustomerSource
): string {
  switch (action) {
    case "submit":
      return source === "ADMIN"
        ? "Customer submitted and activated"
        : "Customer submitted for verification"
    case "verify":
      return "Customer verified"
    case "approve":
      return "Customer approved and activated"
    case "reject":
      return "Customer rejected"
    case "rework":
      return "Customer sent back for rework"
    case "deactivate":
      return "Customer deactivated"
    case "activate":
      return "Customer activated"
  }
}
