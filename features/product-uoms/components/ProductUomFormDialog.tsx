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
import { FormTextField } from "@/components/common/form-fields"
import { Spinner } from "@/components/ui/spinner"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { useProductUom } from "../hooks/use-product-uom"
import { useCreateProductUom } from "../hooks/use-create-product-uom"
import { useUpdateProductUom } from "../hooks/use-update-product-uom"

const uomSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(50)
    .regex(/^[A-Za-z0-9._-]+$/, "Only letters, numbers, dot, underscore, hyphen"),
  name: z.string().min(1, "Name is required").max(160),
  description: z.string().max(500).optional(),
})

type UomFormValues = z.infer<typeof uomSchema>

type ProductUomFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  /** When set, the dialog edits that UOM; otherwise it creates one */
  uomUuid?: string | null
}

function toFormDefaults(): UomFormValues {
  return {
    code: "",
    name: "",
    description: "",
  }
}

export function ProductUomFormDialog({
  open,
  onOpenChange,
  companyUuid,
  uomUuid,
}: ProductUomFormDialogProps) {
  const isEdit = !!uomUuid
  const { data: uom, isLoading: isDetailLoading } = useProductUom(
    companyUuid,
    uomUuid ?? ""
  )
  const createMutation = useCreateProductUom(companyUuid)
  const updateMutation = useUpdateProductUom(companyUuid)

  const { handleSubmit, control, reset } = useForm<UomFormValues>({
    resolver: zodResolver(uomSchema),
    defaultValues: toFormDefaults(),
  })

  useEffect(() => {
    if (!open) return
    if (isEdit) {
      if (uom) {
        reset({
          code: uom.code,
          name: uom.name,
          description: uom.description ?? "",
        })
      }
    } else {
      reset(toFormDefaults())
    }
  }, [open, isEdit, uom, reset])

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    (isEdit && isDetailLoading)

  const onSubmit = (values: UomFormValues) => {
    if (isEdit) {
      if (!uomUuid) return
      // Backend PUT accepts only name, description (+ version); code is immutable.
      updateMutation.mutate(
        {
          uomUuid,
          input: {
            name: values.name,
            description: values.description || undefined,
          },
        },
        {
          onSuccess: () => {
            toast.success("Product UOM updated")
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
          toast.success("Product UOM created")
          reset(toFormDefaults())
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
            {isEdit ? "Edit Product UOM" : "Create Product UOM"}
          </DialogTitle>
        </DialogHeader>
        {isEdit && isDetailLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FieldGroup>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
                  className="lg:col-span-2"
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
