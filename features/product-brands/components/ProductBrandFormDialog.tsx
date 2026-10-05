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
import { useProductBrand } from "../hooks/use-product-brand"
import { useCreateProductBrand } from "../hooks/use-create-product-brand"
import { useUpdateProductBrand } from "../hooks/use-update-product-brand"

const brandSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(50)
    .regex(/^[A-Za-z0-9._-]+$/, "Only letters, numbers, dot, underscore, hyphen"),
  name: z.string().min(1, "Name is required").max(160),
  description: z.string().max(500).optional(),
})

type BrandFormValues = z.infer<typeof brandSchema>

type ProductBrandFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  /** When set, the dialog edits that brand; otherwise it creates one */
  brandUuid?: string | null
}

function toFormDefaults(): BrandFormValues {
  return {
    code: "",
    name: "",
    description: "",
  }
}

export function ProductBrandFormDialog({
  open,
  onOpenChange,
  companyUuid,
  brandUuid,
}: ProductBrandFormDialogProps) {
  const isEdit = !!brandUuid
  const { data: brand, isLoading: isDetailLoading } = useProductBrand(
    companyUuid,
    brandUuid ?? ""
  )
  const createMutation = useCreateProductBrand(companyUuid)
  const updateMutation = useUpdateProductBrand(companyUuid)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: toFormDefaults(),
  })

  useEffect(() => {
    if (!open) return
    if (isEdit) {
      if (brand) {
        reset({
          code: brand.code,
          name: brand.name,
          description: brand.description ?? "",
        })
      }
    } else {
      reset(toFormDefaults())
    }
  }, [open, isEdit, brand, reset])

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    (isEdit && isDetailLoading)

  const onSubmit = (values: BrandFormValues) => {
    if (isEdit) {
      if (!brandUuid) return
      // Backend PUT accepts only name, description (+ version); code is immutable.
      updateMutation.mutate(
        {
          brandUuid,
          input: {
            name: values.name,
            description: values.description || undefined,
          },
        },
        {
          onSuccess: () => {
            toast.success("Product brand updated")
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
          toast.success("Product brand created")
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
            {isEdit ? "Edit Product Brand" : "Create Product Brand"}
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
                <Field>
                  <FieldLabel>Code</FieldLabel>
                  <Input
                    placeholder="e.g. BOSCH"
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
                    placeholder="e.g. Bosch"
                    aria-invalid={!!errors.name}
                    {...register("name")}
                    autoComplete="off"
                  />
                  <FieldError errors={[errors.name]} />
                </Field>
                <Field className="lg:col-span-2">
                  <FieldLabel>Description</FieldLabel>
                  <Input
                    placeholder="Optional"
                    {...register("description")}
                  />
                  <FieldError errors={[errors.description]} />
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
