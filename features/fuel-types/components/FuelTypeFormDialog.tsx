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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { FormTextField } from "@/components/common/form-fields"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { useFuelType } from "../hooks/use-fuel-type"
import { useCreateFuelType } from "../hooks/use-create-fuel-type"
import { useUpdateFuelType } from "../hooks/use-update-fuel-type"

const fuelTypeSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(50)
    .regex(/^[A-Za-z0-9_-]+$/, "Invalid code"),
  name: z.string().min(1, "Name is required").max(160),
})

type FuelTypeFormValues = z.infer<typeof fuelTypeSchema>

type FuelTypeFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  /** When set, the dialog edits that fuel type; otherwise it creates one */
  fuelTypeUuid?: string | null
}

export function FuelTypeFormDialog({
  open,
  onOpenChange,
  companyUuid,
  fuelTypeUuid,
}: FuelTypeFormDialogProps) {
  const isEdit = !!fuelTypeUuid
  const { data: fuelType, isLoading: isDetailLoading } = useFuelType(
    companyUuid,
    fuelTypeUuid ?? ""
  )
  const createMutation = useCreateFuelType(companyUuid)
  const updateMutation = useUpdateFuelType(companyUuid)

  const { handleSubmit, control, reset } = useForm<FuelTypeFormValues>({
    resolver: zodResolver(fuelTypeSchema),
    defaultValues: { code: "", name: "" },
  })

  useEffect(() => {
    if (!open) return
    if (isEdit) {
      if (fuelType) {
        reset({ code: fuelType.code, name: fuelType.name })
      }
    } else {
      reset({ code: "", name: "" })
    }
  }, [open, isEdit, fuelType, reset])

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    (isEdit && isDetailLoading)

  const onSubmit = (values: FuelTypeFormValues) => {
    if (isEdit) {
      if (!fuelTypeUuid) return
      updateMutation.mutate(
        {
          fuelTypeUuid,
          input: {
            name: values.name,
            ...(fuelType?.version !== undefined
              ? { version: fuelType.version }
              : {}),
          },
        },
        {
          onSuccess: () => {
            toast.success("Fuel type updated")
            handleOpenChange(false)
          },
          onError: (error) => {
            toast.error(getApiErrorMessage(error, "Failed"))
          },
        }
      )
      return
    }
    createMutation.mutate(
      { code: values.code, name: values.name },
      {
        onSuccess: () => {
          toast.success("Fuel type created")
          reset({ code: "", name: "" })
          handleOpenChange(false)
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error, "Failed"))
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Fuel Type" : "Create Fuel Type"}
          </DialogTitle>
        </DialogHeader>
        {isEdit && isDetailLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FieldGroup>
              <div className="grid grid-cols-1 gap-4">
                <FormTextField
                  control={control}
                  name="code"
                  label="Code"
                  disabled={isEdit}
                />
                <FormTextField control={control} name="name" label="Name" />
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
        )}
      </DialogContent>
    </Dialog>
  )
}
