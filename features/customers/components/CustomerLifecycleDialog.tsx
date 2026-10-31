"use client"

import { useState } from "react"
import {
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
import { getApiError, getApiErrorMessage } from "@/lib/api/api-error"
import { PERMISSIONS } from "@/lib/permissions"
import { GeographyCombobox } from "@/features/geographies/components/GeographyCombobox"
import { useCustomerLifecycleAction } from "../hooks/use-customer-lifecycle-action"
import type {
  CustomerLifecycleAction,
  CustomerLifecycleStatus,
  CustomerSource,
} from "../api/customer.types"

export type LifecycleActionMeta = {
  action: CustomerLifecycleAction
  label: string
  description: string
  requiresReason?: boolean
  destructive?: boolean
  icon: LucideIcon
  /** Permission the API enforces for this transition. */
  permission: string
}

const ACTION_META: Record<CustomerLifecycleAction, LifecycleActionMeta> = {
  submit: {
    action: "submit",
    label: "Submit",
    description:
      "Sends the customer for approval. Admins and reporting managers activate it immediately when the territory is resolved.",
    icon: Send,
    permission: PERMISSIONS.CUSTOMER.MANAGE,
  },
  approve: {
    action: "approve",
    label: "Approve & activate",
    description:
      "Approves the submitted customer and activates the outlet. One verified KYC entry (none pending) and one verified bank account are required.",
    icon: CheckCircle2,
    permission: PERMISSIONS.CUSTOMER.APPROVE,
  },
  reject: {
    action: "reject",
    label: "Reject",
    description: "Rejects the customer. A reason is required.",
    requiresReason: true,
    destructive: true,
    icon: XCircle,
    permission: PERMISSIONS.CUSTOMER.APPROVE,
  },
  rework: {
    action: "rework",
    label: "Send back for rework",
    description: "Returns the customer to the owner for corrections.",
    requiresReason: true,
    icon: RotateCcw,
    permission: PERMISSIONS.CUSTOMER.APPROVE,
  },
  deactivate: {
    action: "deactivate",
    label: "Deactivate",
    description: "Deactivates the customer. Identifiers are released.",
    destructive: true,
    icon: CircleOff,
    permission: PERMISSIONS.CUSTOMER.MANAGE,
  },
  activate: {
    action: "activate",
    label: "Activate",
    description: "Reactivates the customer and reclaims its identifiers.",
    icon: Power,
    permission: PERMISSIONS.CUSTOMER.MANAGE,
  },
}

/**
 * Lifecycle transitions permitted for a status. Mirrors
 * `CustomerService.target` — anything not listed here is rejected by the API.
 * `SUBMITTED` goes straight to `ACTIVE` through `/approve`; there is no
 * separate `verify` step (`VERIFIED` survives on legacy rows only).
 */
export function lifecycleActionsFor(
  status: CustomerLifecycleStatus
): LifecycleActionMeta[] {
  switch (status) {
    case "DRAFT":
    case "REWORK":
      return [ACTION_META.submit]
    case "SUBMITTED":
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

/**
 * Transitions the API refuses for the customer's own creator
 * (`CustomerService.requireApprover`): approve, reject and rework.
 */
export const REVIEW_LIFECYCLE_ACTIONS: readonly CustomerLifecycleAction[] = [
  "approve",
  "reject",
  "rework",
]

type CustomerLifecycleDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  customer: {
    uuid: string
    lifecycleStatus: CustomerLifecycleStatus
    source: CustomerSource
    version: number
    /** Null while geography is unresolved — approve then needs a territory. */
    territoryUuid?: string | null
    /** Server-computed KYC + bank readiness for approval. */
    kycBankComplete?: boolean
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
  const [territoryUuid, setTerritoryUuid] = useState("")
  const [touched, setTouched] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const mutation = useCustomerLifecycleAction(companyUuid)

  const meta = action ? ACTION_META[action] : null
  const requiresReason = !!meta?.requiresReason
  const needsTerritory =
    action === "approve" && customer != null && !customer.territoryUuid
  const reasonError =
    touched && requiresReason && reason.trim().length === 0
      ? "A reason is required for this action."
      : null
  const territoryError =
    touched && needsTerritory && !territoryUuid
      ? "Select the territory this customer belongs to."
      : null

  const handleOpenChange = (next: boolean) => {
    if (mutation.isPending) return
    if (!next) {
      setReason("")
      setTerritoryUuid("")
      setTouched(false)
      setFieldError(null)
    }
    onOpenChange(next)
  }

  const handleConfirm = () => {
    if (!customer || !action || !meta) return
    setTouched(true)
    setFieldError(null)
    if (requiresReason && reason.trim().length === 0) return
    if (needsTerritory && !territoryUuid) return

    mutation.mutate(
      {
        customerUuid: customer.uuid,
        action,
        input: {
          version: customer.version,
          reason: reason.trim() || undefined,
          territoryUuid: needsTerritory ? territoryUuid : undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success(successMessage(action, customer.source))
          setReason("")
          setTerritoryUuid("")
          setTouched(false)
          setFieldError(null)
          onOpenChange(false)
          onSuccess?.()
        },
        onError: (error) => {
          const apiError = getApiError(error)
          const details = apiError?.errors ?? []
          const territory = details.find(
            (detail) => detail.field === "territoryUuid"
          )
          // The KYC/bank approval gate and the territory rule both come back
          // as field errors; surface them inline instead of only in a toast.
          const gate = details
            .filter(
              (detail) =>
                detail.field === "kyc" || detail.field === "bank"
            )
            .map((detail) => detail.message)
            .join(" ")
          setFieldError(territory?.message ?? (gate || null))
          toast.error(getApiErrorMessage(error, "Lifecycle action failed"))
        },
      }
    )
  }

  const showApprovalGate =
    action === "approve" && customer?.kycBankComplete === false

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

        {showApprovalGate ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            Verification is incomplete: approval needs at least one verified KYC
            entry, no pending KYC entries and a verified bank account. Verify or
            reject the entries on the KYC and Bank tabs first.
          </div>
        ) : null}

        {needsTerritory ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              Territory <span className="text-destructive">*</span>
            </label>
            <GeographyCombobox
              companyUuid={companyUuid}
              value={territoryUuid || null}
              onValueChange={(value) => setTerritoryUuid(value ?? "")}
              types={["TERRITORY"]}
              status="ACTIVE"
              placeholder="Select territory..."
            />
            <p className="text-xs text-muted-foreground">
              The pincode could not be mapped, so approval must assign the
              territory.
            </p>
            {territoryError ? (
              <p role="alert" className="text-xs text-destructive">
                {territoryError}
              </p>
            ) : null}
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
            <p role="alert" className="text-xs text-destructive">
              {reasonError}
            </p>
          ) : null}
        </div>

        {fieldError ? (
          <p role="alert" className="text-sm text-destructive">
            {fieldError}
          </p>
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
        : "Customer submitted for approval"
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
