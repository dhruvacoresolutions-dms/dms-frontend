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
  FormDateField,
  FormTextField,
  requiredLabel,
} from "@/components/common/form-fields"
import { applyApiFieldErrors } from "@/lib/api/form-errors"
import { NAME_MAX_LENGTH } from "../configs/calendar.constants"
import { useCreateAccountingPeriod } from "../hooks/use-create-accounting-period"
import { useUpdateAccountingPeriod } from "../hooks/use-update-accounting-period"
import { getCalendarErrorMessage } from "../utils/calendar.utils"
import type {
  AccountingPeriod,
  FiscalYear,
} from "../api/company-calendar.types"

type PeriodFormValues = {
  name: string
  startDate: string
  endDate: string
}

type AccountingPeriodFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  fiscalYear: FiscalYear
  /** When set, the dialog edits that period; otherwise it creates one. */
  period?: AccountingPeriod | null
  /** Pre-filled start date for a new period (day after the last period). */
  suggestedStartDate?: string
}

function buildSchema(fiscalYear: FiscalYear) {
  return z
    .object({
      name: z
        .string()
        .trim()
        .min(1, "Name is required")
        .max(
          NAME_MAX_LENGTH,
          `Name must not exceed ${NAME_MAX_LENGTH} characters`
        ),
      startDate: z.string().min(1, "Start date is required"),
      endDate: z.string().min(1, "End date is required"),
    })
    .superRefine((values, ctx) => {
      if (values.startDate && values.startDate < fiscalYear.startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["startDate"],
          message: `Start date must be on or after the fiscal year start (${fiscalYear.startDate})`,
        })
      }
      if (values.endDate && values.endDate > fiscalYear.endDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endDate"],
          message: `End date must be on or before the fiscal year end (${fiscalYear.endDate})`,
        })
      }
      if (
        values.startDate &&
        values.endDate &&
        values.endDate < values.startDate
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endDate"],
          message: "End date must be on or after start date",
        })
      }
    })
}

export function AccountingPeriodFormDialog({
  open,
  onOpenChange,
  companyUuid,
  fiscalYear,
  period,
  suggestedStartDate,
}: AccountingPeriodFormDialogProps) {
  const isEdit = !!period
  const createMutation = useCreateAccountingPeriod(companyUuid)
  const updateMutation = useUpdateAccountingPeriod(companyUuid)

  const defaultValues: PeriodFormValues = {
    name: "",
    startDate: suggestedStartDate ?? fiscalYear.startDate,
    endDate: fiscalYear.endDate,
  }

  const { control, handleSubmit, reset, setError } = useForm<PeriodFormValues>({
    resolver: zodResolver(buildSchema(fiscalYear)),
    defaultValues,
  })

  useEffect(() => {
    if (!open) return
    reset(
      period
        ? {
            name: period.name,
            startDate: period.startDate,
            endDate: period.endDate,
          }
        : {
            name: "",
            startDate: suggestedStartDate ?? fiscalYear.startDate,
            endDate: fiscalYear.endDate,
          }
    )
  }, [open, period, fiscalYear, suggestedStartDate, reset])

  const handleOpenChange = (next: boolean) => {
    if (!next) reset(defaultValues)
    onOpenChange(next)
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = (values: PeriodFormValues) => {
    const payload = {
      name: values.name.trim(),
      startDate: values.startDate,
      endDate: values.endDate,
    }

    const onError = (error: unknown) => {
      applyApiFieldErrors(error, setError)
      toast.error(
        getCalendarErrorMessage(error, "Failed to save accounting period")
      )
    }

    if (isEdit && period) {
      updateMutation.mutate(
        {
          fiscalYearUuid: fiscalYear.uuid,
          periodUuid: period.uuid,
          input: payload,
        },
        {
          onSuccess: () => {
            toast.success("Accounting period updated")
            handleOpenChange(false)
          },
          onError,
        }
      )
      return
    }

    createMutation.mutate(
      { fiscalYearUuid: fiscalYear.uuid, input: payload },
      {
        onSuccess: () => {
          toast.success("Accounting period created")
          handleOpenChange(false)
        },
        onError,
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Accounting Period" : "Create Accounting Period"}
          </DialogTitle>
          <DialogDescription>
            Periods must stay inside the fiscal year and remain contiguous with
            the existing periods (no gaps or overlaps).
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <FieldGroup>
            <FormTextField
              control={control}
              name="name"
              label={requiredLabel("Name")}
              maxLength={NAME_MAX_LENGTH}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormDateField
                control={control}
                name="startDate"
                label={requiredLabel("Start date")}
              />
              <FormDateField
                control={control}
                name="endDate"
                label={requiredLabel("End date")}
              />
            </div>
          </FieldGroup>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEdit
                  ? "Saving..."
                  : "Creating..."
                : isEdit
                  ? "Save changes"
                  : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
