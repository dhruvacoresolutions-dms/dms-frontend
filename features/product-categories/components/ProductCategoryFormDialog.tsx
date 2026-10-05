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
import {
  FormComboboxField,
  FormTextField,
} from "@/components/common/form-fields"
import { Spinner } from "@/components/ui/spinner"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { useProductCategory } from "../hooks/use-product-category"
import { useCreateProductCategory } from "../hooks/use-create-product-category"
import { useUpdateProductCategory } from "../hooks/use-update-product-category"
import { ProductCategoryCombobox } from "./ProductCategoryCombobox"

const categorySchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(50)
    .regex(/^[A-Za-z0-9._-]+$/, "Only letters, numbers, dot, underscore, hyphen"),
  name: z.string().min(1, "Name is required").max(160),
  parentCategoryUuid: z.string().optional(),
  description: z.string().max(500).optional(),
})

type CategoryFormValues = z.infer<typeof categorySchema>

type ProductCategoryFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  /** When set, the dialog edits that category; otherwise it creates one */
  categoryUuid?: string | null
}

function toFormDefaults(): CategoryFormValues {
  return {
    code: "",
    name: "",
    parentCategoryUuid: "",
    description: "",
  }
}

const orUndefined = (v: unknown) =>
  v === "" || v === undefined || v === null ? undefined : (v as string)

export function ProductCategoryFormDialog({
  open,
  onOpenChange,
  companyUuid,
  categoryUuid,
}: ProductCategoryFormDialogProps) {
  const isEdit = !!categoryUuid
  const { data: category, isLoading: isDetailLoading } = useProductCategory(
    companyUuid,
    categoryUuid ?? ""
  )
  const createMutation = useCreateProductCategory(companyUuid)
  const updateMutation = useUpdateProductCategory(companyUuid)

  const { handleSubmit, control, reset } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: toFormDefaults(),
  })

  useEffect(() => {
    if (!open) return
    if (isEdit) {
      if (category) {
        reset({
          code: category.code,
          name: category.name,
          parentCategoryUuid: "",
          description: category.description ?? "",
        })
      }
    } else {
      reset(toFormDefaults())
    }
  }, [open, isEdit, category, reset])

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    (isEdit && isDetailLoading)

  const onSubmit = (values: CategoryFormValues) => {
    if (isEdit) {
      if (!categoryUuid) return
      // Backend PUT accepts only name, description (+ version);
      // code and parent are immutable here (parent moves via PATCH /parent).
      updateMutation.mutate(
        {
          categoryUuid,
          input: {
            name: values.name,
            description: values.description || undefined,
          },
        },
        {
          onSuccess: () => {
            toast.success("Product category updated")
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
        ...(orUndefined(values.parentCategoryUuid)
          ? { parentCategoryUuid: orUndefined(values.parentCategoryUuid) }
          : {}),
      },
      {
        onSuccess: () => {
          toast.success("Product category created")
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
            {isEdit ? "Edit Product Category" : "Create Product Category"}
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
                {!isEdit && (
                  <FormComboboxField
                    control={control}
                    name="parentCategoryUuid"
                    label="Parent Category (optional)"
                    companyUuid={companyUuid}
                    Combobox={ProductCategoryCombobox}
                    comboboxProps={{
                      excludeIds: categoryUuid ? [categoryUuid] : [],
                    }}
                    className="lg:col-span-2"
                  />
                )}
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
