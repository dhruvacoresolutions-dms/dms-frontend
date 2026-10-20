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
  MAX_VISIT_PLAN_NOTE_LENGTH,
  getVisitPlanErrorMessage,
} from "../lib/visit-plan.utils"
import { useRejectVisitPlan } from "../hooks/use-reject-visit-plan"
import type { VisitPlan } from "../api/visit-plan.types"

const rejectSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "Reason is required")
    .max(
      MAX_VISIT_PLAN_NOTE_LENGTH,
      `Reason must not exceed ${MAX_VISIT_PLAN_NOTE_LENGTH} characters`
    ),
})

type RejectFormValues = z.infer<typeof rejectSchema>

type RejectVisitPlanDialogProps = {
  companyUuid: string
  plan: VisitPlan | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Reject a PENDING_APPROVAL plan with a required 1..2000-character reason. */
export function RejectVisitPlanDialog({
  companyUuid,
  plan,
  open,
  onOpenChange,
}: RejectVisitPlanDialogProps) {
  const rejectMutation = useRejectVisitPlan(companyUuid)
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
          toast.success("Visit plan rejected")
          onOpenChange(false)
        },
        onError: (error) => {
          if (!applyApiFieldErrors(error, setError)) {
            toast.error(
              getVisitPlanErrorMessage(error, "Failed to reject visit plan")
            )
            return
          }
          toast.error(getApiErrorMessage(error, "Failed to reject visit plan"))
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reject visit plan</DialogTitle>
          <DialogDescription>
            The employee will see this reason and can edit or resubmit the plan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <FormTextareaField
              control={control}
              name="reason"
              label={requiredLabel("Reason")}
              placeholder="Enter the reason for rejection"
              maxLength={MAX_VISIT_PLAN_NOTE_LENGTH}
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
