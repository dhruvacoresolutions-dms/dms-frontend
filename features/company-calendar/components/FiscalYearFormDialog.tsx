"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
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
  FormSelectField,
  FormTextField,
  requiredLabel,
} from "@/components/common/form-fields"
import { applyApiFieldErrors } from "@/lib/api/form-errors"
import {
  CALENDAR_STATUS_OPTIONS,
  NAME_MAX_LENGTH,
} from "../configs/calendar.constants"
import { useCreateFiscalYear } from "../hooks/use-create-fiscal-year"
import { useUpdateFiscalYear } from "../hooks/use-update-fiscal-year"
import { getCalendarErrorMessage } from "../utils/calendar.utils"
import type { FiscalYear } from "../api/company-calendar.types"

const fiscalYearSchema = z
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
    status: z.enum(["ACTIVE", "INACTIVE"]),
  })
  .refine(
    (values) =>
      !values.startDate ||
      !values.endDate ||
      values.endDate >= values.startDate,
    {
      path: ["endDate"],
      message: "End date must be on or after start date",
    }
  )

type FiscalYearFormValues = z.infer<typeof fiscalYearSchema>

const EMPTY_VALUES: FiscalYearFormValues = {
  name: "",
  startDate: "",
  endDate: "",
  status: "ACTIVE",
}

type FiscalYearFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  /** When set, the dialog edits that fiscal year; otherwise it creates one. */
  fiscalYear?: FiscalYear | null
}

export function FiscalYearFormDialog({
  open,
  onOpenChange,
  companyUuid,
  fiscalYear,
}: FiscalYearFormDialogProps) {
  const isEdit = !!fiscalYear
  const createMutation = useCreateFiscalYear(companyUuid)
  const updateMutation = useUpdateFiscalYear(companyUuid)

  const { control, handleSubmit, reset, setError } =
    useForm<FiscalYearFormValues>({
      resolver: zodResolver(fiscalYearSchema),
      defaultValues: EMPTY_VALUES,
    })

  useEffect(() => {
    if (!open) return
    reset(
      fiscalYear
        ? {
            name: fiscalYear.name,
            startDate: fiscalYear.startDate,
            endDate: fiscalYear.endDate,
            status: fiscalYear.status,
          }
        : EMPTY_VALUES
    )
  }, [open, fiscalYear, reset])

  const handleOpenChange = (next: boolean) => {
    if (!next) reset(EMPTY_VALUES)
    onOpenChange(next)
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = (values: FiscalYearFormValues) => {
    const payload = {
      name: values.name.trim(),
      startDate: values.startDate,
      endDate: values.endDate,
      status: values.status,
    }

    const onError = (error: unknown) => {
      applyApiFieldErrors(error, setError)
      toast.error(getCalendarErrorMessage(error, "Failed to save fiscal year"))
    }

    if (isEdit && fiscalYear) {
      updateMutation.mutate(
        { fiscalYearUuid: fiscalYear.uuid, input: payload },
        {
          onSuccess: () => {
            toast.success("Fiscal year updated")
            handleOpenChange(false)
          },
          onError,
        }
      )
      return
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Fiscal year created")
        handleOpenChange(false)
      },
      onError,
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Fiscal Year" : "Create Fiscal Year"}
          </DialogTitle>
          <DialogDescription>
            Fiscal years are inclusive and must not overlap with an existing
            year.
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
            <FormSelectField
              control={control}
              name="status"
              label={requiredLabel("Status")}
              options={CALENDAR_STATUS_OPTIONS}
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
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {isEdit ? "Saving..." : "Creating..."}
                </>
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
