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
import { useProductCategory } from "../hooks/use-product-category"
import { useProductCategories } from "../hooks/use-product-categories"
import { useCreateProductCategory } from "../hooks/use-create-product-category"
import { useUpdateProductCategory } from "../hooks/use-update-product-category"

const NO_PARENT = "__none"

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
    parentCategoryUuid: NO_PARENT,
    description: "",
  }
}

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

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: toFormDefaults(),
  })

  const parentValue = watch("parentCategoryUuid") ?? NO_PARENT

  const { data: parentOptionsData } = useProductCategories(
    companyUuid,
    { status: "ACTIVE", size: 100 },
    { enabled: open && !isEdit && !!companyUuid }
  )
  const parentOptions = (parentOptionsData?.content ?? []).filter(
    (c) => c.categoryUuid !== categoryUuid
  )

  useEffect(() => {
    if (!open) return
    if (isEdit) {
      if (category) {
        reset({
          code: category.code,
          name: category.name,
          parentCategoryUuid: NO_PARENT,
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
        ...(values.parentCategoryUuid &&
        values.parentCategoryUuid !== NO_PARENT
          ? { parentCategoryUuid: values.parentCategoryUuid }
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
                <Field>
                  <FieldLabel>Code</FieldLabel>
                  <Input
                    placeholder="e.g. BRAKES"
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
                    placeholder="e.g. Brakes"
                    aria-invalid={!!errors.name}
                    {...register("name")}
                    autoComplete="off"
                  />
                  <FieldError errors={[errors.name]} />
                </Field>
                {!isEdit && (
                  <Field className="lg:col-span-2">
                    <FieldLabel>Parent Category (optional)</FieldLabel>
                    <Select
                      value={parentValue}
                      onValueChange={(v: string | null) =>
                        v && setValue("parentCategoryUuid", v, { shouldValidate: true })
                      }
                    >
                      <SelectTrigger aria-invalid={!!errors.parentCategoryUuid}>
                        <SelectValue placeholder="No parent (top level)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_PARENT}>
                          No parent (top level)
                        </SelectItem>
                        {parentOptions.map((c) => (
                          <SelectItem key={c.categoryUuid} value={c.categoryUuid}>
                            {c.name} ({c.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={[errors.parentCategoryUuid]} />
                  </Field>
                )}
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
