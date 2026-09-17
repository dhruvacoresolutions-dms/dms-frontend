"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldLabel } from "@/components/ui/field"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { useUpdateCompanyStatus } from "../hooks/use-update-company-status"
import {
  COMPANY_STATUS_OPTIONS,
  type CompanyStatusOption,
} from "../configs/company.config"
import type { CompanyStatus } from "../api/company.types"

type CompanyStatusDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string | null
  companyName?: string
  currentStatus?: string
}

function statusLabel(status: string): string {
  return (
    (COMPANY_STATUS_OPTIONS as readonly CompanyStatusOption[]).find(
      (o) => o.value === status
    )?.label ?? status
  )
}

export function CompanyStatusDialog({
  open,
  onOpenChange,
  companyUuid,
  companyName,
  currentStatus,
}: CompanyStatusDialogProps) {
  const [status, setStatus] = useState<CompanyStatus>("ACTIVE")
  const [initKey, setInitKey] = useState<string | null>(null)
  const updateMutation = useUpdateCompanyStatus()

  // Reset the selection whenever the dialog is (re-)opened — render-phase
  // adjustment so no effect setState is needed.
  const openKey = open ? `${companyUuid}-${currentStatus ?? ""}` : null
  if (openKey !== initKey) {
    setInitKey(openKey)
    if (openKey) {
      const valid: CompanyStatus[] = ["ACTIVE", "INACTIVE", "SUSPENDED"]
      setStatus(
        valid.includes(currentStatus as CompanyStatus)
          ? (currentStatus as CompanyStatus)
          : "ACTIVE"
      )
    }
  }

  const handleConfirm = () => {
    if (!companyUuid) return
    updateMutation.mutate(
      { companyUuid, input: { status } },
      {
        onSuccess: () => {
          toast.success(`Company status updated to ${statusLabel(status)}`)
          onOpenChange(false)
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error, "Failed to update status"))
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Company Status</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {companyName ? (
              <>
                Select the new lifecycle status for{" "}
                <span className="font-medium text-foreground">{companyName}</span>
                {currentStatus && (
                  <>
                    {" "}(currently{" "}
                    <span className="font-medium text-foreground">
                      {statusLabel(currentStatus)}
                    </span>
                    )
                  </>
                )}
                .
              </>
            ) : (
              "Select the new lifecycle status for this company."
            )}
          </p>
          <Field>
            <FieldLabel>Status</FieldLabel>
            <Select
              value={status}
              onValueChange={(v: string | null) => {
                if (v) setStatus(v as CompanyStatus)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {(
                  COMPANY_STATUS_OPTIONS as readonly CompanyStatusOption[]
                ).map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={
                updateMutation.isPending || status === currentStatus
              }
            >
              {updateMutation.isPending ? "Saving..." : "Save Status"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
