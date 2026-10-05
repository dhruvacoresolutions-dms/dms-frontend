"use client"

import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { useVehicleVariant } from "../hooks/use-vehicle-variant"
import { useCreateVehicleVariant } from "../hooks/use-create-vehicle-variant"
import { useUpdateVehicleVariant } from "../hooks/use-update-vehicle-variant"
import { useVehicleModels } from "@/features/vehicle-models/hooks/use-vehicle-models"

const variantSchema = z.object({
  modelUuid: z.string().min(1, "Model is required"),
  code: z
    .string()
    .min(1, "Code is required")
    .max(50)
    .regex(/^[A-Za-z0-9_-]+$/, "Invalid code"),
  name: z.string().min(1, "Name is required").max(160),
})

type VariantFormValues = z.infer<typeof variantSchema>

type VehicleVariantFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  /** When set, the dialog edits that variant; otherwise it creates one */
  variantUuid?: string | null
}

export function VehicleVariantFormDialog({
  open,
  onOpenChange,
  companyUuid,
  variantUuid,
}: VehicleVariantFormDialogProps) {
  const isEdit = !!variantUuid
  const { data: variant, isLoading: isDetailLoading } = useVehicleVariant(
    companyUuid,
    variantUuid ?? ""
  )
  const createMutation = useCreateVehicleVariant(companyUuid)
  const updateMutation = useUpdateVehicleVariant(companyUuid)
  const { data: modelsData, isLoading: modelsLoading } = useVehicleModels(
    companyUuid,
    { size: 100, status: "ACTIVE" },
    { enabled: open && !!companyUuid }
  )
  const modelOptions = modelsData?.content ?? []

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<VariantFormValues>({
    resolver: zodResolver(variantSchema),
    defaultValues: { modelUuid: "", code: "", name: "" },
  })

  const modelUuidValue = useWatch({ control, name: "modelUuid" })

  useEffect(() => {
    if (!open) return
    if (isEdit) {
      if (variant) {
        reset({
          modelUuid: variant.modelUuid,
          code: variant.code,
          name: variant.name,
        })
      }
    } else {
      reset({ modelUuid: "", code: "", name: "" })
    }
  }, [open, isEdit, variant, reset])

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    (isEdit && isDetailLoading)

  const onSubmit = (values: VariantFormValues) => {
    if (isEdit) {
      if (!variantUuid) return
      updateMutation.mutate(
        {
          variantUuid,
          input: {
            modelUuid: values.modelUuid,
            name: values.name,
            ...(variant?.version !== undefined
              ? { version: variant.version }
              : {}),
          },
        },
        {
          onSuccess: () => {
            toast.success("Vehicle variant updated")
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
        modelUuid: values.modelUuid,
        code: values.code,
        name: values.name,
      },
      {
        onSuccess: () => {
          toast.success("Vehicle variant created")
          reset({ modelUuid: "", code: "", name: "" })
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
            {isEdit ? "Edit Vehicle Variant" : "Create Vehicle Variant"}
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
                  <FieldLabel>Model</FieldLabel>
                  <Select
                    value={modelUuidValue ?? ""}
                    onValueChange={(v: string | null) =>
                      v &&
                      setValue("modelUuid", v, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger aria-invalid={!!errors.modelUuid}>
                      <SelectValue
                        placeholder={
                          modelsLoading ? "Loading..." : "Select model"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {modelOptions.map((m) => (
                        <SelectItem key={m.modelUuid} value={m.modelUuid}>
                          {m.name} ({m.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={[errors.modelUuid]} />
                </Field>
                <Field>
                  <FieldLabel>Code</FieldLabel>
                  <Input
                    placeholder="e.g. SWIFT-VXI"
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
                    placeholder="e.g. Swift VXI"
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
