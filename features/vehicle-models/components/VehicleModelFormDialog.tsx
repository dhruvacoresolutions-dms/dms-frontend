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
import {
  FormComboboxField,
  FormTextField,
} from "@/components/common/form-fields"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { useVehicleModel } from "../hooks/use-vehicle-model"
import { useCreateVehicleModel } from "../hooks/use-create-vehicle-model"
import { useUpdateVehicleModel } from "../hooks/use-update-vehicle-model"
import { VehicleMakeCombobox } from "@/features/vehicle-makes/components/VehicleMakeCombobox"

const modelSchema = z.object({
  makeUuid: z.string().min(1, "Make is required"),
  code: z
    .string()
    .min(1, "Code is required")
    .max(50)
    .regex(/^[A-Za-z0-9_-]+$/, "Invalid code"),
  name: z.string().min(1, "Name is required").max(160),
})

type ModelFormValues = z.infer<typeof modelSchema>

type VehicleModelFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  /** When set, the dialog edits that model; otherwise it creates one */
  modelUuid?: string | null
}

export function VehicleModelFormDialog({
  open,
  onOpenChange,
  companyUuid,
  modelUuid,
}: VehicleModelFormDialogProps) {
  const isEdit = !!modelUuid
  const { data: model, isLoading: isDetailLoading } = useVehicleModel(
    companyUuid,
    modelUuid ?? ""
  )
  const createMutation = useCreateVehicleModel(companyUuid)
  const updateMutation = useUpdateVehicleModel(companyUuid)

  const { handleSubmit, control, reset } = useForm<ModelFormValues>({
    resolver: zodResolver(modelSchema),
    defaultValues: { makeUuid: "", code: "", name: "" },
  })

  useEffect(() => {
    if (!open) return
    if (isEdit) {
      if (model) {
        reset({
          makeUuid: model.makeUuid,
          code: model.code,
          name: model.name,
        })
      }
    } else {
      reset({ makeUuid: "", code: "", name: "" })
    }
  }, [open, isEdit, model, reset])

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    (isEdit && isDetailLoading)

  const onSubmit = (values: ModelFormValues) => {
    if (isEdit) {
      if (!modelUuid) return
      updateMutation.mutate(
        {
          modelUuid,
          input: {
            makeUuid: values.makeUuid,
            name: values.name,
            ...(model?.version !== undefined
              ? { version: model.version }
              : {}),
          },
        },
        {
          onSuccess: () => {
            toast.success("Vehicle model updated")
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
      {
        makeUuid: values.makeUuid,
        code: values.code,
        name: values.name,
      },
      {
        onSuccess: () => {
          toast.success("Vehicle model created")
          reset({ makeUuid: "", code: "", name: "" })
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
            {isEdit ? "Edit Vehicle Model" : "Create Vehicle Model"}
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
                <FormComboboxField
                  control={control}
                  name="makeUuid"
                  label="Make"
                  companyUuid={companyUuid}
                  Combobox={VehicleMakeCombobox}
                />
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
