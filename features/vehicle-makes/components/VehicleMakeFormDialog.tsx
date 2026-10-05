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
import { useVehicleMake } from "../hooks/use-vehicle-make"
import { useCreateVehicleMake } from "../hooks/use-create-vehicle-make"
import { useUpdateVehicleMake } from "../hooks/use-update-vehicle-make"

const makeSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(50)
    .regex(/^[A-Za-z0-9_-]+$/, "Invalid code"),
  name: z.string().min(1, "Name is required").max(160),
  description: z.string().max(500).optional(),
})

type MakeFormValues = z.infer<typeof makeSchema>

type VehicleMakeFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  /** When set, the dialog edits that make; otherwise it creates one */
  makeUuid?: string | null
}

export function VehicleMakeFormDialog({
  open,
  onOpenChange,
  companyUuid,
  makeUuid,
}: VehicleMakeFormDialogProps) {
  const isEdit = !!makeUuid
  const { data: make, isLoading: isDetailLoading } = useVehicleMake(
    companyUuid,
    makeUuid ?? ""
  )
  const createMutation = useCreateVehicleMake(companyUuid)
  const updateMutation = useUpdateVehicleMake(companyUuid)

  const { handleSubmit, control, reset } = useForm<MakeFormValues>({
    resolver: zodResolver(makeSchema),
    defaultValues: { code: "", name: "", description: "" },
  })

  useEffect(() => {
    if (!open) return
    if (isEdit) {
      if (make) {
        reset({
          code: make.code,
          name: make.name,
          description: make.description ?? "",
        })
      }
    } else {
      reset({ code: "", name: "", description: "" })
    }
  }, [open, isEdit, make, reset])

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    (isEdit && isDetailLoading)

  const onSubmit = (values: MakeFormValues) => {
    if (isEdit) {
      if (!makeUuid) return
      updateMutation.mutate(
        {
          makeUuid,
          input: {
            name: values.name,
            description: values.description || undefined,
            ...(make?.version !== undefined
              ? { version: make.version }
              : {}),
          },
        },
        {
          onSuccess: () => {
            toast.success("Vehicle make updated")
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
        code: values.code,
        name: values.name,
        description: values.description || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Vehicle make created")
          reset({ code: "", name: "", description: "" })
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
            {isEdit ? "Edit Vehicle Make" : "Create Vehicle Make"}
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
                <FormTextField
                  control={control}
                  name="description"
                  label="Description"
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
        )}
      </DialogContent>
    </Dialog>
  )
}
