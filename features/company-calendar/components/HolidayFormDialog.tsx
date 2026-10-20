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
  FormComboboxField,
  FormDateField,
  FormSelectField,
  FormTextField,
  requiredLabel,
} from "@/components/common/form-fields"
import { GeographyCombobox } from "@/features/geographies/components/GeographyCombobox"
import { applyApiFieldErrors } from "@/lib/api/form-errors"
import {
  CALENDAR_STATUS_OPTIONS,
  NAME_MAX_LENGTH,
} from "../configs/calendar.constants"
import { useCreateHoliday } from "../hooks/use-create-holiday"
import { useUpdateHoliday } from "../hooks/use-update-holiday"
import { getCalendarErrorMessage } from "../utils/calendar.utils"
import type { Holiday } from "../api/company-calendar.types"

const holidaySchema = z.object({
  holidayDate: z.string().min(1, "Holiday date is required"),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(NAME_MAX_LENGTH, `Name must not exceed ${NAME_MAX_LENGTH} characters`),
  geographyUuid: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
})

type HolidayFormValues = z.infer<typeof holidaySchema>

const EMPTY_VALUES: HolidayFormValues = {
  holidayDate: "",
  name: "",
  geographyUuid: "",
  status: "ACTIVE",
}

type HolidayFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  /** When set, the dialog edits that holiday; otherwise it creates one. */
  holiday?: Holiday | null
}

export function HolidayFormDialog({
  open,
  onOpenChange,
  companyUuid,
  holiday,
}: HolidayFormDialogProps) {
  const isEdit = !!holiday
  const createMutation = useCreateHoliday(companyUuid)
  const updateMutation = useUpdateHoliday(companyUuid)

  const { control, handleSubmit, reset, setError } = useForm<HolidayFormValues>(
    {
      resolver: zodResolver(holidaySchema),
      defaultValues: EMPTY_VALUES,
    }
  )

  useEffect(() => {
    if (!open) return
    reset(
      holiday
        ? {
            holidayDate: holiday.holidayDate,
            name: holiday.name,
            geographyUuid: holiday.geographyUuid ?? "",
            status: holiday.status,
          }
        : EMPTY_VALUES
    )
  }, [open, holiday, reset])

  const handleOpenChange = (next: boolean) => {
    if (!next) reset(EMPTY_VALUES)
    onOpenChange(next)
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = (values: HolidayFormValues) => {
    const payload = {
      holidayDate: values.holidayDate,
      name: values.name.trim(),
      geographyUuid: values.geographyUuid || null,
      status: values.status,
    }

    const onError = (error: unknown) => {
      applyApiFieldErrors(error, setError)
      toast.error(getCalendarErrorMessage(error, "Failed to save holiday"))
    }

    if (isEdit && holiday) {
      updateMutation.mutate(
        { holidayUuid: holiday.uuid, input: payload },
        {
          onSuccess: () => {
            toast.success("Holiday updated")
            handleOpenChange(false)
          },
          onError,
        }
      )
      return
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Holiday created")
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
            {isEdit ? "Edit Holiday" : "Create Holiday"}
          </DialogTitle>
          <DialogDescription>
            Leave the geography empty for a company-wide holiday. Each date can
            have only one company-wide holiday and one holiday per geography.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <FieldGroup>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormDateField
                control={control}
                name="holidayDate"
                label={requiredLabel("Holiday date")}
              />
              <FormSelectField
                control={control}
                name="status"
                label={requiredLabel("Status")}
                options={CALENDAR_STATUS_OPTIONS}
              />
            </div>
            <FormTextField
              control={control}
              name="name"
              label={requiredLabel("Name")}
              maxLength={NAME_MAX_LENGTH}
            />
            <FormComboboxField
              control={control}
              name="geographyUuid"
              label="Geography (optional)"
              companyUuid={companyUuid}
              Combobox={GeographyCombobox}
              comboboxProps={{
                status: "ACTIVE",
                placeholder: "Company-wide (all geographies)",
              }}
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
