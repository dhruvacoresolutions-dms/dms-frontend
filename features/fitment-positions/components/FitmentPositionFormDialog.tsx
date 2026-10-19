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
import { FormTextField, requiredLabel } from "@/components/common/form-fields"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { applyApiFieldErrors } from "@/lib/api/form-errors"
import { requiredCode, requiredName } from "@/lib/validations/master-data"
import { useFitmentPosition } from "../hooks/use-fitment-position"
import { useCreateFitmentPosition } from "../hooks/use-create-fitment-position"
import { useUpdateFitmentPosition } from "../hooks/use-update-fitment-position"

const fitmentPositionSchema = z.object({
  code: requiredCode("Code", 50),
  name: requiredName("Name", 160),
})

type FitmentPositionFormValues = z.infer<typeof fitmentPositionSchema>

type FitmentPositionFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  /** When set, the dialog edits that fitment position; otherwise it creates one */
  fitmentPositionUuid?: string | null
}

export function FitmentPositionFormDialog({
  open,
  onOpenChange,
  companyUuid,
  fitmentPositionUuid,
}: FitmentPositionFormDialogProps) {
  const isEdit = !!fitmentPositionUuid
  const { data: fitmentPosition, isLoading: isDetailLoading } =
    useFitmentPosition(companyUuid, fitmentPositionUuid ?? "")
  const createMutation = useCreateFitmentPosition(companyUuid)
  const updateMutation = useUpdateFitmentPosition(companyUuid)

  const { handleSubmit, control, reset, setError } =
    useForm<FitmentPositionFormValues>({
      resolver: zodResolver(fitmentPositionSchema),
      defaultValues: { code: "", name: "" },
    })

  useEffect(() => {
    if (!open) return
    if (isEdit) {
      if (fitmentPosition) {
        reset({
          code: fitmentPosition.code,
          name: fitmentPosition.name,
        })
      }
    } else {
      reset({ code: "", name: "" })
    }
  }, [open, isEdit, fitmentPosition, reset])

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    (isEdit && isDetailLoading)

  const onSubmit = (values: FitmentPositionFormValues) => {
    if (isEdit) {
      if (!fitmentPositionUuid) return
      updateMutation.mutate(
        {
          fitmentPositionUuid,
          input: {
            name: values.name,
            ...(fitmentPosition?.version !== undefined
              ? { version: fitmentPosition.version }
              : {}),
          },
        },
        {
          onSuccess: () => {
            toast.success("Fitment position updated")
            handleOpenChange(false)
          },
          onError: (error) => {
            applyApiFieldErrors(error, setError)
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
          toast.success("Fitment position created")
          reset({ code: "", name: "" })
          handleOpenChange(false)
        },
        onError: (error) => {
          applyApiFieldErrors(error, setError)
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
            {isEdit ? "Edit Fitment Position" : "Create Fitment Position"}
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
                  label={requiredLabel("Code", !isEdit)}
                  disabled={isEdit}
                />
                <FormTextField
                  control={control}
                  name="name"
                  label={requiredLabel("Name")}
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
