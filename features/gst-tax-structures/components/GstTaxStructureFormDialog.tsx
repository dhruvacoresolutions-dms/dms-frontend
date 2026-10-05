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
import { useGstTaxStructure } from "../hooks/use-gst-tax-structure"
import { useCreateGstTaxStructure } from "../hooks/use-create-gst-tax-structure"
import { useUpdateGstTaxStructure } from "../hooks/use-update-gst-tax-structure"

// Optional numeric rate input: blank means null. Coerce via valueAsNumber and
// map NaN -> null on submit.
const optionalRate = z.union([z.number(), z.nan()]).optional()

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

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<TaxStructureFormValues>({
    resolver: zodResolver(taxStructureSchema),
    defaultValues: toFormDefaults(),
  })

  const discountBeforeTaxValue = useWatch({ control, name: "discountBeforeTax" })
  const discountAfterTaxValue = useWatch({ control, name: "discountAfterTax" })

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

  const rateField = (
    name:
      | "primaryInputRate"
      | "primaryOutputRate"
      | "secondaryInputRate"
      | "secondaryOutputRate"
      | "additionalInputRate"
      | "additionalOutputRate"
      | "cessRate"
      | "cessAmount",
    label: string
  ) => (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Input
        type="number"
        step="any"
        min="0"
        placeholder="e.g. 9.0"
        aria-invalid={!!errors[name]}
        {...register(name, { valueAsNumber: true })}
      />
      <FieldError errors={[errors[name]]} />
    </Field>
  )

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
                <Field>
                  <FieldLabel>Tax Type</FieldLabel>
                  <Input
                    placeholder="e.g. CGST"
                    aria-invalid={!!errors.taxType}
                    {...register("taxType")}
                    autoComplete="off"
                  />
                  <FieldError errors={[errors.taxType]} />
                </Field>
                <Field>
                  <FieldLabel>Tax Code</FieldLabel>
                  <Input
                    placeholder="e.g. CGST-9"
                    aria-invalid={!!errors.taxCode}
                    {...register("taxCode")}
                    autoComplete="off"
                  />
                  <FieldError errors={[errors.taxCode]} />
                </Field>
                <Field>
                  <FieldLabel>Apply On</FieldLabel>
                  <Input
                    placeholder="e.g. Tax Amount"
                    aria-invalid={!!errors.applyOn}
                    {...register("applyOn")}
                    autoComplete="off"
                  />
                  <FieldError errors={[errors.applyOn]} />
                </Field>
                {rateField("primaryInputRate", "Primary Input Rate")}
                {rateField("primaryOutputRate", "Primary Output Rate")}
                {rateField("secondaryInputRate", "Secondary Input Rate")}
                {rateField("secondaryOutputRate", "Secondary Output Rate")}
                {rateField("additionalInputRate", "Additional Input Rate")}
                {rateField("additionalOutputRate", "Additional Output Rate")}
                {rateField("cessRate", "Cess Rate")}
                {rateField("cessAmount", "Cess Amount")}
                <Field>
                  <FieldLabel>Discount Before Tax</FieldLabel>
                  <Select
                    value={discountBeforeTaxValue ?? ""}
                    onValueChange={(v: string | null) =>
                      v &&
                      setValue(
                        "discountBeforeTax",
                        v as TaxStructureFormValues["discountBeforeTax"],
                        { shouldValidate: true }
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError errors={[errors.discountBeforeTax]} />
                </Field>
                <Field>
                  <FieldLabel>Discount After Tax</FieldLabel>
                  <Select
                    value={discountAfterTaxValue ?? ""}
                    onValueChange={(v: string | null) =>
                      v &&
                      setValue(
                        "discountAfterTax",
                        v as TaxStructureFormValues["discountAfterTax"],
                        { shouldValidate: true }
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError errors={[errors.discountAfterTax]} />
                </Field>
                <Field>
                  <FieldLabel>Effective From</FieldLabel>
                  <Input type="date" {...register("effectiveFrom")} />
                  <FieldError errors={[errors.effectiveFrom]} />
                </Field>
                <Field>
                  <FieldLabel>Effective To</FieldLabel>
                  <Input type="date" {...register("effectiveTo")} />
                  <FieldError errors={[errors.effectiveTo]} />
                </Field>
                <Field>
                  <FieldLabel>Scheme Discount Effect</FieldLabel>
                  <Input
                    placeholder="Optional"
                    {...register("schemeDiscountEffect")}
                  />
                  <FieldError errors={[errors.schemeDiscountEffect]} />
                </Field>
                <Field>
                  <FieldLabel>Cash Discount Effect</FieldLabel>
                  <Input
                    placeholder="Optional"
                    {...register("cashDiscountEffect")}
                  />
                  <FieldError errors={[errors.cashDiscountEffect]} />
                </Field>
                <Field>
                  <FieldLabel>DB Discount Effect</FieldLabel>
                  <Input
                    placeholder="Optional"
                    {...register("dbDiscountEffect")}
                  />
                  <FieldError errors={[errors.dbDiscountEffect]} />
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
