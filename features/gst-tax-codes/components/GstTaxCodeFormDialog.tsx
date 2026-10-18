"use client"

import { useEffect, useRef } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field"
import {
  FormDateField,
  FormNumberField,
  FormPercentageField,
  FormSelectField,
  FormTextareaField,
  FormTextField,
} from "@/components/common/form-fields"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { useCreateGstTaxCode } from "../hooks/use-create-gst-tax-code"
import { useCreateGstTaxCodeVersion } from "../hooks/use-create-gst-tax-code-version"
import type {
  CreateGstTaxCodeRequest,
  GstCessType,
  GstTaxCodeResponse,
  GstTaxCodeStatus,
} from "../api/gst-tax-code.types"

const optionalRate = z.coerce.number().optional()

const cessTypeOptions: { value: GstCessType; label: string }[] = [
  { value: "NONE", label: "None" },
  { value: "PERCENTAGE", label: "Percentage" },
  { value: "FIXED_AMOUNT", label: "Fixed Amount" },
  { value: "BOTH", label: "Both" },
]

const statusOptions: { value: GstTaxCodeStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
]

const taxCodeSchema = z.object({
  taxCode: z
    .string()
    .min(1, "Tax code is required")
    .max(50)
    .regex(/^[A-Za-z0-9._-]+$/, "Use letters, digits, dot, underscore or dash"),
  description: z.string().max(500).optional(),
  totalRate: optionalRate,
  cgstRate: optionalRate,
  sgstRate: optionalRate,
  igstRate: optionalRate,
  cessType: z.enum(["NONE", "PERCENTAGE", "FIXED_AMOUNT", "BOTH"]),
  cessRate: optionalRate,
  cessAmount: optionalRate,
  cessAmountBasis: z.string().max(120).optional(),
  effectiveFrom: z.string().min(1, "Effective from is required"),
  effectiveTo: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
})

type TaxCodeFormValues = z.infer<typeof taxCodeSchema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  /**
   * `create` starts a brand-new tax code. `new-version` publishes a new
   * effective-dated version of the code passed in `source`.
   */
  mode?: "create" | "new-version"
  source?: GstTaxCodeResponse | null
}

function todayISO(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}

function toFormDefaults(): TaxCodeFormValues {
  return {
    taxCode: "",
    description: "",
    totalRate: undefined,
    cgstRate: undefined,
    sgstRate: undefined,
    igstRate: undefined,
    cessType: "NONE",
    cessRate: undefined,
    cessAmount: undefined,
    cessAmountBasis: "",
    effectiveFrom: todayISO(),
    effectiveTo: "",
    status: "ACTIVE",
  }
}

const rateToForm = (v: number | null | undefined) =>
  typeof v === "number" ? v : undefined
const rateToPayload = (v: number | undefined) =>
  typeof v === "number" && !Number.isNaN(v) ? v : null
const textToPayload = (v?: string) => (v?.trim() ? v.trim() : null)

export function GstTaxCodeFormDialog({
  open,
  onOpenChange,
  companyUuid,
  mode = "create",
  source,
}: Props) {
  const isNewVersion = mode === "new-version"
  const createMutation = useCreateGstTaxCode(companyUuid)
  const versionMutation = useCreateGstTaxCodeVersion(companyUuid)

  const { handleSubmit, control, reset, setValue } = useForm<TaxCodeFormValues>({
    resolver: zodResolver(taxCodeSchema),
    defaultValues: toFormDefaults(),
  })

  // Keep CGST and SGST in sync (intra-state rates are always equal).
  const cgstRate = useWatch({ control, name: "cgstRate" })
  const sgstRate = useWatch({ control, name: "sgstRate" })
  const prevRates = useRef<{
    cgst: number | undefined
    sgst: number | undefined
  }>({ cgst: undefined, sgst: undefined })
  useEffect(() => {
    const prev = prevRates.current
    if (cgstRate !== prev.cgst && cgstRate !== sgstRate) {
      prevRates.current = { cgst: cgstRate, sgst: cgstRate }
      setValue("sgstRate", cgstRate, { shouldValidate: true })
    } else if (sgstRate !== prev.sgst && sgstRate !== cgstRate) {
      prevRates.current = { cgst: sgstRate, sgst: sgstRate }
      setValue("cgstRate", sgstRate, { shouldValidate: true })
    } else {
      prevRates.current = { cgst: cgstRate, sgst: sgstRate }
    }
  }, [cgstRate, sgstRate, setValue])

  useEffect(() => {
    if (!open) return
    if (isNewVersion && source) {
      reset({
        taxCode: source.taxCode,
        description: source.description ?? "",
        totalRate: rateToForm(source.totalRate),
        cgstRate: rateToForm(source.cgstRate),
        sgstRate: rateToForm(source.sgstRate),
        igstRate: rateToForm(source.igstRate),
        cessType: (source.cessType ?? "NONE") as GstCessType,
        cessRate: rateToForm(source.cessRate),
        cessAmount: rateToForm(source.cessAmount),
        cessAmountBasis: source.cessAmountBasis ?? "",
        effectiveFrom: todayISO(),
        effectiveTo: "",
        status: "ACTIVE",
      })
    } else {
      reset(toFormDefaults())
    }
  }, [open, isNewVersion, source, reset])

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const isPending = createMutation.isPending || versionMutation.isPending

  const toPayload = (values: TaxCodeFormValues): CreateGstTaxCodeRequest => ({
    taxCode: values.taxCode.trim(),
    description: textToPayload(values.description),
    totalRate: rateToPayload(values.totalRate),
    cgstRate: rateToPayload(values.cgstRate),
    sgstRate: rateToPayload(values.sgstRate),
    igstRate: rateToPayload(values.igstRate),
    cessType: values.cessType,
    cessRate: rateToPayload(values.cessRate),
    cessAmount: rateToPayload(values.cessAmount),
    cessAmountBasis: textToPayload(values.cessAmountBasis),
    effectiveFrom: values.effectiveFrom,
    effectiveTo: textToPayload(values.effectiveTo),
    status: values.status,
  })

  const onSubmit = (values: TaxCodeFormValues) => {
    const payload = toPayload(values)
    if (isNewVersion) {
      if (!source) return
      versionMutation.mutate(
        {
          taxCode: source.taxCode,
          input: { ...payload, previousVersion: source.version },
        },
        {
          onSuccess: () => {
            toast.success("New tax code version published")
            handleOpenChange(false)
          },
          onError: (error) =>
            toast.error(getApiErrorMessage(error, "Failed")),
        }
      )
      return
    }
    createMutation.mutate(
      { ...payload, previousVersion: null },
      {
        onSuccess: () => {
          toast.success("GST tax code created")
          handleOpenChange(false)
        },
        onError: (error) => toast.error(getApiErrorMessage(error, "Failed")),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isNewVersion ? "New Tax Code Version" : "Create GST Tax Code"}
          </DialogTitle>
          <DialogDescription>
            {isNewVersion
              ? "Publish a new effective-dated version of this tax code. The code itself stays the same."
              : "Define a GST rate structure. Each tax code starts with one active version."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FieldGroup className="gap-8">
            <FieldSet>
              <FieldLegend className="mb-3">Basic Details</FieldLegend>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormTextField
                  control={control}
                  name="taxCode"
                  label="Tax Code *"
                  disabled={isNewVersion}
                />
                <FormSelectField
                  control={control}
                  name="status"
                  label="Status"
                  options={statusOptions}
                />
              </div>
              <FormTextareaField
                control={control}
                name="description"
                label="Description"
              />
            </FieldSet>

            <FieldSet>
              <FieldLegend className="mb-3">GST Rates (%)</FieldLegend>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <FormPercentageField
                  control={control}
                  name="totalRate"
                  label="Total Rate"
                />
                <FormPercentageField
                  control={control}
                  name="cgstRate"
                  label="CGST Rate"
                />
                <FormPercentageField
                  control={control}
                  name="sgstRate"
                  label="SGST Rate"
                />
                <FormPercentageField
                  control={control}
                  name="igstRate"
                  label="IGST Rate"
                />
              </div>
            </FieldSet>

            <FieldSet>
              <FieldLegend className="mb-3">Cess</FieldLegend>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormSelectField
                  control={control}
                  name="cessType"
                  label="Cess Type"
                  options={cessTypeOptions}
                />
                <FormPercentageField
                  control={control}
                  name="cessRate"
                  label="Cess Rate"
                />
                <FormNumberField
                  control={control}
                  name="cessAmount"
                  label="Cess Amount"
                  min={0}
                />
              </div>
              <FormTextField
                control={control}
                name="cessAmountBasis"
                label="Cess Amount Basis"
              />
            </FieldSet>

            <FieldSet>
              <FieldLegend className="mb-3">Validity</FieldLegend>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormDateField
                  control={control}
                  name="effectiveFrom"
                  label="Effective From *"
                />
                <FormDateField
                  control={control}
                  name="effectiveTo"
                  label="Effective To"
                />
              </div>
            </FieldSet>
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
                ? isNewVersion
                  ? "Publishing..."
                  : "Creating..."
                : isNewVersion
                  ? "Publish version"
                  : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
