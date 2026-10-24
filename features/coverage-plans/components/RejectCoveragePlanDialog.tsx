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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import {
  FormTextareaField,
  requiredLabel,
} from "@/components/common/form-fields"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { applyApiFieldErrors } from "@/lib/api/form-errors"
import {
  MAX_COVERAGE_REASON_LENGTH,
  formatCoverageDateRange,
  getCoveragePlanErrorMessage,
} from "../lib/coverage-plan.utils"
import { useRejectCoveragePlan } from "../hooks/use-reject-coverage-plan"
import type { CoveragePlan } from "../api/coverage-plan.types"

const rejectSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "Reason is required")
    .max(
      MAX_COVERAGE_REASON_LENGTH,
      `Reason must not exceed ${MAX_COVERAGE_REASON_LENGTH} characters`
    ),
})

type RejectFormValues = z.infer<typeof rejectSchema>

type RejectCoveragePlanDialogProps = {
  companyUuid: string
  plan: CoveragePlan | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Reject a PENDING_APPROVAL coverage plan with a required reason. */
export function RejectCoveragePlanDialog({
  companyUuid,
  plan,
  open,
  onOpenChange,
}: RejectCoveragePlanDialogProps) {
  const rejectMutation = useRejectCoveragePlan(companyUuid)
  const { control, handleSubmit, reset, setError } = useForm<RejectFormValues>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { reason: "" },
  })

  useEffect(() => {
    if (open) reset({ reason: "" })
  }, [open, plan?.uuid, reset])

  const onSubmit = (values: RejectFormValues) => {
    if (!plan) return
    rejectMutation.mutate(
      { planUuid: plan.uuid, input: { reason: values.reason.trim() } },
      {
        onSuccess: () => {
          toast.success("Coverage plan rejected")
          onOpenChange(false)
        },
        onError: (error) => {
          if (!applyApiFieldErrors(error, setError)) {
            toast.error(
              getCoveragePlanErrorMessage(
                error,
                "Failed to reject coverage plan"
              )
            )
            return
          }
          toast.error(
            getApiErrorMessage(error, "Failed to reject coverage plan")
          )
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reject coverage plan</DialogTitle>
          <DialogDescription>
            {plan
              ? `${formatCoverageDateRange(plan.startDate, plan.endDate)} · `
              : ""}
            The employee will see this reason and can edit and resubmit the
            template.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <FormTextareaField
              control={control}
              name="reason"
              label={requiredLabel("Reason")}
              placeholder="Explain what must change before resubmission"
              maxLength={MAX_COVERAGE_REASON_LENGTH}
              rows={4}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={rejectMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={rejectMutation.isPending}
              >
                {rejectMutation.isPending ? (
                  <Spinner className="mr-2 size-4" />
                ) : null}
                Reject
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}
