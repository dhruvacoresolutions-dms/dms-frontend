"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FieldGroup } from "@/components/ui/field"
import {
  FormTextareaField,
  requiredLabel,
} from "@/components/common/form-fields"
import { applyApiFieldErrors } from "@/lib/api/form-errors"
import { REOPEN_REASON_MAX_LENGTH } from "../configs/calendar.constants"
import {
  formatCalendarDateTime,
  getCalendarErrorMessage,
} from "../utils/calendar.utils"
import { useReopenAccountingPeriod } from "../hooks/use-reopen-accounting-period"
import type { AccountingPeriod } from "../api/company-calendar.types"

const reopenSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "Reason is required")
    .max(
      REOPEN_REASON_MAX_LENGTH,
      `Reason must not exceed ${REOPEN_REASON_MAX_LENGTH} characters`
    ),
})

type ReopenFormValues = z.infer<typeof reopenSchema>

const EMPTY_VALUES: ReopenFormValues = { reason: "" }

type ReopenPeriodDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  fiscalYearUuid: string
  period: AccountingPeriod | null
}

export function ReopenPeriodDialog({
  open,
  onOpenChange,
  companyUuid,
  fiscalYearUuid,
  period,
}: ReopenPeriodDialogProps) {
  const reopenMutation = useReopenAccountingPeriod(companyUuid)
  const { control, handleSubmit, reset, setError } = useForm<ReopenFormValues>({
    resolver: zodResolver(reopenSchema),
    defaultValues: EMPTY_VALUES,
  })

  useEffect(() => {
    if (open) reset(EMPTY_VALUES)
  }, [open, reset])

  const handleOpenChange = (next: boolean) => {
    if (!next) reset(EMPTY_VALUES)
    onOpenChange(next)
  }

  const onSubmit = (values: ReopenFormValues) => {
    if (!period) return
    reopenMutation.mutate(
      {
        fiscalYearUuid,
        periodUuid: period.uuid,
        reason: values.reason.trim(),
      },
      {
        onSuccess: () => {
          toast.success("Accounting period reopened")
          handleOpenChange(false)
        },
        onError: (error) => {
          applyApiFieldErrors(error, setError)
          toast.error(getCalendarErrorMessage(error, "Failed to reopen period"))
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reopen Accounting Period</DialogTitle>
          <DialogDescription>
            {period
              ? `“${period.name}” was closed${
                  period.closedAt
                    ? ` on ${formatCalendarDateTime(period.closedAt)}`
                    : ""
                }. A reason is required and is stored in the audit trail.`
              : "A reason is required and is stored in the audit trail."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <FieldGroup>
            <FormTextareaField
              control={control}
              name="reason"
              label={requiredLabel("Reason")}
              rows={4}
              placeholder="Enter the reason for reopening this period"
            />
          </FieldGroup>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={reopenMutation.isPending}>
              {reopenMutation.isPending ? "Reopening..." : "Reopen period"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
