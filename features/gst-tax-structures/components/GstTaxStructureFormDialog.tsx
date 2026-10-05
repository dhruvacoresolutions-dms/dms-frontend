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
  FormDateField,
  FormNumberField,
  FormSelectField,
  FormTextField,
} from "@/components/common/form-fields"
import { Spinner } from "@/components/ui/spinner"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { useGstTaxStructure } from "../hooks/use-gst-tax-structure"
import { useCreateGstTaxStructure } from "../hooks/use-create-gst-tax-structure"
import { useUpdateGstTaxStructure } from "../hooks/use-update-gst-tax-structure"

// Optional numeric rate input: blank means undefined (FormNumberField yields
// undefined for empty input), mapped to null on submit.
const optionalRate = z.coerce.number().optional()

const taxStructureSchema = z.object({
  taxType: z.string().min(1, "Tax type is required").max(50),
  taxCode: z.string().min(1, "Tax code is required").max(50),
  primaryInputRate: optionalRate,
  primaryOutputRate: optionalRate,
  secondaryInputRate: optionalRate,
  secondaryOutputRate: optionalRate,
  additionalInputRate: optionalRate,
  additionalOutputRate: optionalRate,
  applyOn: z.string().max(100).optional(),
  cessRate: optionalRate,
  cessAmount: optionalRate,
  discountBeforeTax: z.enum(["true", "false"]).optional(),
  discountAfterTax: z.enum(["true", "false"]).optional(),
  schemeDiscountEffect: z.string().max(100).optional(),
  cashDiscountEffect: z.string().max(100).optional(),
  dbDiscountEffect: z.string().max(100).optional(),
  effectiveFrom: z.string().optional(),
  effectiveTo: z.string().optional(),
})

type TaxStructureFormValues = z.infer<typeof taxStructureSchema>

type GstTaxStructureFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  /** When set, the dialog edits that tax structure; otherwise it creates one */
  taxStructureUuid?: string | null
}

function toFormDefaults(): TaxStructureFormValues {
  return {
    taxType: "",
    taxCode: "",
    primaryInputRate: undefined,
    primaryOutputRate: undefined,
    secondaryInputRate: undefined,
    secondaryOutputRate: undefined,
    additionalInputRate: undefined,
    additionalOutputRate: undefined,
    applyOn: "",
    cessRate: undefined,
    cessAmount: undefined,
    discountBeforeTax: undefined,
    discountAfterTax: undefined,
    schemeDiscountEffect: "",
    cashDiscountEffect: "",
    dbDiscountEffect: "",
    effectiveFrom: "",
    effectiveTo: "",
  }
}

const rateToForm = (v: number | null | undefined) =>
  typeof v === "number" ? v : undefined
const boolToForm = (
  v: boolean | null | undefined
): "true" | "false" | undefined =>
  v === true ? "true" : v === false ? "false" : undefined
const rateToPayload = (v: number | undefined) =>
  typeof v === "number" && !Number.isNaN(v) ? v : null
const emptyToNull = (v?: string) => (v?.trim() ? v.trim() : null)
const boolToPayload = (v?: string) =>
  v === "true" ? true : v === "false" ? false : null

const YES_NO_OPTIONS = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
] as const

export function GstTaxStructureFormDialog({
  open,
  onOpenChange,
  companyUuid,
  taxStructureUuid,
}: GstTaxStructureFormDialogProps) {
  const isEdit = !!taxStructureUuid
  const { data: taxStructure, isLoading: isDetailLoading } =
    useGstTaxStructure(companyUuid, taxStructureUuid ?? "")
  const createMutation = useCreateGstTaxStructure(companyUuid)
  const updateMutation = useUpdateGstTaxStructure(companyUuid)

  const { handleSubmit, control, reset } = useForm<TaxStructureFormValues>({
    resolver: zodResolver(taxStructureSchema),
    defaultValues: toFormDefaults(),
  })

  useEffect(() => {
    if (!open) return
    if (isEdit) {
      if (taxStructure) {
        reset({
          taxType: taxStructure.taxType,
          taxCode: taxStructure.taxCode,
          primaryInputRate: rateToForm(taxStructure.primaryInputRate),
          primaryOutputRate: rateToForm(taxStructure.primaryOutputRate),
          secondaryInputRate: rateToForm(taxStructure.secondaryInputRate),
          secondaryOutputRate: rateToForm(taxStructure.secondaryOutputRate),
          additionalInputRate: rateToForm(taxStructure.additionalInputRate),
          additionalOutputRate: rateToForm(taxStructure.additionalOutputRate),
          applyOn: taxStructure.applyOn ?? "",
          cessRate: rateToForm(taxStructure.cessRate),
          cessAmount: rateToForm(taxStructure.cessAmount),
          discountBeforeTax: boolToForm(taxStructure.discountBeforeTax),
          discountAfterTax: boolToForm(taxStructure.discountAfterTax),
          schemeDiscountEffect: taxStructure.schemeDiscountEffect ?? "",
          cashDiscountEffect: taxStructure.cashDiscountEffect ?? "",
          dbDiscountEffect: taxStructure.dbDiscountEffect ?? "",
          effectiveFrom: taxStructure.effectiveFrom ?? "",
          effectiveTo: taxStructure.effectiveTo ?? "",
        })
      }
    } else {
      reset(toFormDefaults())
    }
  }, [open, isEdit, taxStructure, reset])

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    (isEdit && isDetailLoading)

  const toPayload = (values: TaxStructureFormValues) => ({
    taxType: values.taxType.trim(),
    taxCode: values.taxCode.trim(),
    primaryInputRate: rateToPayload(values.primaryInputRate),
    primaryOutputRate: rateToPayload(values.primaryOutputRate),
    secondaryInputRate: rateToPayload(values.secondaryInputRate),
    secondaryOutputRate: rateToPayload(values.secondaryOutputRate),
    additionalInputRate: rateToPayload(values.additionalInputRate),
    additionalOutputRate: rateToPayload(values.additionalOutputRate),
    applyOn: emptyToNull(values.applyOn),
    cessRate: rateToPayload(values.cessRate),
    cessAmount: rateToPayload(values.cessAmount),
    discountBeforeTax: boolToPayload(values.discountBeforeTax),
    discountAfterTax: boolToPayload(values.discountAfterTax),
    schemeDiscountEffect: emptyToNull(values.schemeDiscountEffect),
    cashDiscountEffect: emptyToNull(values.cashDiscountEffect),
    dbDiscountEffect: emptyToNull(values.dbDiscountEffect),
    effectiveFrom: emptyToNull(values.effectiveFrom),
    effectiveTo: emptyToNull(values.effectiveTo),
  })

  const onSubmit = (values: TaxStructureFormValues) => {
    if (isEdit) {
      if (!taxStructureUuid) return
      updateMutation.mutate(
        {
          taxStructureUuid,
          input: {
            ...toPayload(values),
            ...(typeof taxStructure?.version === "number"
              ? { version: taxStructure.version }
              : {}),
          },
        },
        {
          onSuccess: () => {
            toast.success("GST tax structure updated")
            handleOpenChange(false)
          },
          onError: (error) => {
            toast.error(getApiErrorMessage(error, "Failed"))
          },
        }
      )
      return
    }
    createMutation.mutate(toPayload(values), {
      onSuccess: () => {
        toast.success("GST tax structure created")
        reset(toFormDefaults())
        handleOpenChange(false)
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, "Failed"))
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit GST Tax Structure" : "Create GST Tax Structure"}
          </DialogTitle>
        </DialogHeader>
        {isEdit && isDetailLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FieldGroup>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <FormTextField
                  control={control}
                  name="taxType"
                  label="Tax Type"
                />
                <FormTextField
                  control={control}
                  name="taxCode"
                  label="Tax Code"
                />
                <FormTextField
                  control={control}
                  name="applyOn"
                  label="Apply On"
                />
                <FormNumberField
                  control={control}
                  name="primaryInputRate"
                  label="Primary Input Rate"
                  min={0}
                />
                <FormNumberField
                  control={control}
                  name="primaryOutputRate"
                  label="Primary Output Rate"
                  min={0}
                />
                <FormNumberField
                  control={control}
                  name="secondaryInputRate"
                  label="Secondary Input Rate"
                  min={0}
                />
                <FormNumberField
                  control={control}
                  name="secondaryOutputRate"
                  label="Secondary Output Rate"
                  min={0}
                />
                <FormNumberField
                  control={control}
                  name="additionalInputRate"
                  label="Additional Input Rate"
                  min={0}
                />
                <FormNumberField
                  control={control}
                  name="additionalOutputRate"
                  label="Additional Output Rate"
                  min={0}
                />
                <FormNumberField
                  control={control}
                  name="cessRate"
                  label="Cess Rate"
                  min={0}
                />
                <FormNumberField
                  control={control}
                  name="cessAmount"
                  label="Cess Amount"
                  min={0}
                />
                <FormSelectField
                  control={control}
                  name="discountBeforeTax"
                  label="Discount Before Tax"
                  options={YES_NO_OPTIONS}
                />
                <FormSelectField
                  control={control}
                  name="discountAfterTax"
                  label="Discount After Tax"
                  options={YES_NO_OPTIONS}
                />
                <FormDateField
                  control={control}
                  name="effectiveFrom"
                  label="Effective From"
                />
                <FormDateField
                  control={control}
                  name="effectiveTo"
                  label="Effective To"
                />
                <FormTextField
                  control={control}
                  name="schemeDiscountEffect"
                  label="Scheme Discount Effect"
                />
                <FormTextField
                  control={control}
                  name="cashDiscountEffect"
                  label="Cash Discount Effect"
                />
                <FormTextField
                  control={control}
                  name="dbDiscountEffect"
                  label="DB Discount Effect"
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
