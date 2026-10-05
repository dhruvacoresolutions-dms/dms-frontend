"use client"

import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
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
  FormCheckboxField,
  FormNumberField,
  FormSelectField,
  FormTextField,
} from "@/components/common/form-fields"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { useProductAttributeTemplate } from "../hooks/use-product-attribute-template"
import { useCreateProductAttributeTemplate } from "../hooks/use-create-product-attribute-template"
import { useUpdateProductAttributeTemplate } from "../hooks/use-update-product-attribute-template"
import type { ProductAttributeDataType } from "../api/product-attribute-template.types"

const DATA_TYPES = ["NUMBER", "TEXT", "DATE", "BOOLEAN", "DROPDOWN"] as const

const DATA_TYPE_OPTIONS = DATA_TYPES.map((dt) => ({ value: dt, label: dt }))

function slotsFor(dataType: ProductAttributeDataType): string[] {
  return [1, 2, 3, 4].map((n) => `${dataType}_${n}`)
}

const templateSchema = z.object({
  productType: z.string().min(1, "Product type is required").max(100),
  attributeKey: z
    .string()
    .min(1, "Attribute key is required")
    .max(100)
    .regex(/^[A-Za-z0-9_-]+$/, "Invalid attribute key"),
  label: z.string().min(1, "Label is required").max(160),
  dataType: z.enum(["NUMBER", "TEXT", "DATE", "BOOLEAN", "DROPDOWN"], {
    required_error: "Data type is required",
  }),
  slotAssignment: z.string().min(1, "Slot is required"),
  mandatory: z.boolean(),
  displayOrder: z.coerce.number().int().min(0, "Order must be >= 0"),
})

type TemplateFormValues = z.infer<typeof templateSchema>

type ProductAttributeTemplateFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  /** When set, the dialog edits that template; otherwise it creates one */
  attributeTemplateUuid?: string | null
}

function toFormDefaults(): TemplateFormValues {
  return {
    productType: "",
    attributeKey: "",
    label: "",
    dataType: undefined as unknown as TemplateFormValues["dataType"],
    slotAssignment: "",
    mandatory: false,
    displayOrder: 0,
  }
}

export function ProductAttributeTemplateFormDialog({
  open,
  onOpenChange,
  companyUuid,
  attributeTemplateUuid,
}: ProductAttributeTemplateFormDialogProps) {
  const isEdit = !!attributeTemplateUuid
  const { data: template, isLoading: isDetailLoading } =
    useProductAttributeTemplate(companyUuid, attributeTemplateUuid ?? "")
  const createMutation = useCreateProductAttributeTemplate(companyUuid)
  const updateMutation = useUpdateProductAttributeTemplate(companyUuid)

  const { handleSubmit, setValue, control, reset } =
    useForm<TemplateFormValues>({
      resolver: zodResolver(templateSchema),
      defaultValues: toFormDefaults(),
    })

  const dataTypeValue = useWatch({ control, name: "dataType" })
  const slotValue = useWatch({ control, name: "slotAssignment" })

  const slotOptions = dataTypeValue
    ? slotsFor(dataTypeValue).map((slot) => ({ value: slot, label: slot }))
    : []

  useEffect(() => {
    if (!open) return
    if (isEdit) {
      if (template) {
        reset({
          productType: template.productType,
          attributeKey: template.attributeKey,
          label: template.label,
          dataType: template.dataType,
          slotAssignment: template.slotAssignment,
          mandatory: template.mandatory,
          displayOrder: template.displayOrder,
        })
      }
    } else {
      reset(toFormDefaults())
    }
  }, [open, isEdit, template, reset])

  // Reset slot when data type changes and the slot no longer belongs to it
  useEffect(() => {
    if (!dataTypeValue || isEdit) return
    if (slotValue && slotsFor(dataTypeValue).includes(slotValue)) return
    setValue("slotAssignment", "", { shouldValidate: true })
  }, [dataTypeValue, slotValue, setValue, isEdit])

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    (isEdit && isDetailLoading)

  const onSubmit = (values: TemplateFormValues) => {
    if (isEdit) {
      if (!attributeTemplateUuid || !template) return
      // productType, attributeKey, dataType and slotAssignment are
      // immutable — the backend rejects them on PUT.
      updateMutation.mutate(
        {
          attributeTemplateUuid,
          input: {
            label: values.label,
            mandatory: values.mandatory,
            displayOrder: values.displayOrder,
            version: template.version,
          },
        },
        {
          onSuccess: () => {
            toast.success("Attribute template updated")
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
        productType: values.productType,
        attributeKey: values.attributeKey,
        label: values.label,
        dataType: values.dataType,
        slotAssignment: values.slotAssignment || undefined,
        mandatory: values.mandatory,
        displayOrder: values.displayOrder,
      },
      {
        onSuccess: () => {
          toast.success("Attribute template created")
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Attribute Template" : "Create Attribute Template"}
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
                  name="productType"
                  label="Product Type"
                  disabled={isEdit}
                />
                <FormTextField
                  control={control}
                  name="attributeKey"
                  label="Attribute Key"
                  disabled={isEdit}
                />
                <FormTextField control={control} name="label" label="Label" />
                <FormNumberField
                  control={control}
                  name="displayOrder"
                  label="Display Order"
                  step="1"
                  min={0}
                />
                <div>
                  <FormSelectField
                    control={control}
                    name="dataType"
                    label="Data Type"
                    options={DATA_TYPE_OPTIONS}
                    disabled={isEdit}
                  />
                  {isEdit && (
                    <p className="text-xs text-muted-foreground">
                      Data type cannot be changed after creation.
                    </p>
                  )}
                </div>
                <div>
                  <FormSelectField
                    control={control}
                    name="slotAssignment"
                    label="Slot Assignment"
                    options={slotOptions}
                    disabled={isEdit || !dataTypeValue}
                  />
                  {isEdit && (
                    <p className="text-xs text-muted-foreground">
                      Slot cannot be changed after creation.
                    </p>
                  )}
                </div>
                <FormCheckboxField
                  control={control}
                  name="mandatory"
                  label="Mandatory"
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
