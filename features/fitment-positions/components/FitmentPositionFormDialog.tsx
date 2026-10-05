"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { useFitmentPosition } from "../hooks/use-fitment-position"
import { useCreateFitmentPosition } from "../hooks/use-create-fitment-position"
import { useUpdateFitmentPosition } from "../hooks/use-update-fitment-position"

const fitmentPositionSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(50)
    .regex(/^[A-Za-z0-9_-]+$/, "Invalid code"),
  name: z.string().min(1, "Name is required").max(160),
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FitmentPositionFormValues>({
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
                <Field>
                  <FieldLabel>Code</FieldLabel>
                  <Input
                    placeholder="e.g. FRONT"
                    aria-invalid={!!errors.code}
                    {...register("code")}
                    disabled={isEdit}
                    autoComplete="off"
                  />
                  <FieldError errors={[errors.code]} />
                </Field>
                <Field>
                  <FieldLabel>Name</FieldLabel>
                  <Input
                    placeholder="e.g. Front"
                    aria-invalid={!!errors.name}
                    {...register("name")}
                    autoComplete="off"
                  />
                  <FieldError errors={[errors.name]} />
                </Field>
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
