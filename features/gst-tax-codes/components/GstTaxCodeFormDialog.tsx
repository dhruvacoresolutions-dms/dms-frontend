"use client"

import { useEffect, useMemo, useRef } from "react"
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
  requiredLabel,
} from "@/components/common/form-fields"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { applyApiFieldErrors } from "@/lib/api/form-errors"
import { formatDate } from "@/lib/format"
import { requiredCode } from "@/lib/validations/master-data"
import { useCreateGstTaxCode } from "../hooks/use-create-gst-tax-code"
import { useCreateGstTaxCodeVersion } from "../hooks/use-create-gst-tax-code-version"
import type {
  CreateGstTaxCodeRequest,
  GstCessType,
  GstTaxCodeResponse,
  GstTaxCodeStatus,
} from "../api/gst-tax-code.types"

/** `GstTaxService.CESS_AMOUNT_BASES`. */
const CESS_AMOUNT_BASES = ["PER_UNIT", "PER_QUANTITY", "PER_KG", "PER_LITRE"]

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

/**
 * Rate / amount field. Mirrors `GstTaxService.numeric`: non-negative, at most
 * four decimals. Whether a rate is required is enforced in `buildTaxCodeSchema`
 * so a blank field reads as "missing" instead of zero.
 */
const rateNumber = (label: string) =>
  z.coerce
    .number()
    .refine((v) => Number.isFinite(v), `${label} must be a number`)
    .refine((v) => v >= 0, `${label} cannot be negative`)
    .refine(
      (v) => /^\d+(\.\d{1,4})?$/.test(String(v)),
      `${label} allows at most 4 decimals`
    )

const round4 = (v: number) => Math.round(v * 1e4) / 1e4

const baseTaxCodeSchema = z.object({
  taxCode: requiredCode("Tax Code", 50),
  description: z
    .string()
    .trim()
    .max(500, "Description must not exceed 500 characters")
    .optional(),
  totalRate: rateNumber("Total Rate").optional(),
  cgstRate: rateNumber("CGST Rate").optional(),
  sgstRate: rateNumber("SGST Rate").optional(),
  igstRate: rateNumber("IGST Rate").optional(),
  cessType: z.enum(["NONE", "PERCENTAGE", "FIXED_AMOUNT", "BOTH"]),
  cessRate: rateNumber("Cess Rate").optional(),
  cessAmount: rateNumber("Cess Amount").optional(),
  cessAmountBasis: z
    .string()
    .trim()
    .max(120, "Cess amount basis must not exceed 120 characters")
    .optional()
    .refine(
      (v) => !v || CESS_AMOUNT_BASES.includes(v.toUpperCase()),
      `Allowed: ${CESS_AMOUNT_BASES.join(", ")}`
    ),
  effectiveFrom: z.string().min(1, "Effective from is required"),
  effectiveTo: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
})

type TaxCodeFormValues = z.infer<typeof baseTaxCodeSchema>

/**
 * Mirrors `GstTaxService.validate` (+ `validateNextVersion` for a new version):
 *  - all four rates required; total > 0; CGST + SGST = total and IGST = total
 *  - cess fields must match cessType and cessBasis is only valid for a fixed cess
 *  - effectiveTo must not precede effectiveFrom
 *  - a new version must start today or later and strictly after the previous
 *    version's start / end
 */
function buildTaxCodeSchema(
  isNewVersion: boolean,
  source: GstTaxCodeResponse | null
) {
  return baseTaxCodeSchema.superRefine((values, ctx) => {
    const add = (path: string, message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message })

    const { totalRate, cgstRate, sgstRate, igstRate } = values
    if (totalRate === undefined) add("totalRate", "Total rate is required")
    else if (totalRate <= 0)
      add("totalRate", "Total rate must be greater than 0")
    if (cgstRate === undefined) add("cgstRate", "CGST rate is required")
    if (sgstRate === undefined) add("sgstRate", "SGST rate is required")
    if (igstRate === undefined) add("igstRate", "IGST rate is required")
    if (
      totalRate !== undefined &&
      cgstRate !== undefined &&
      sgstRate !== undefined &&
      round4(cgstRate + sgstRate) !== round4(totalRate)
    ) {
      add("cgstRate", "CGST + SGST must equal the total rate")
    }
    if (
      totalRate !== undefined &&
      igstRate !== undefined &&
      igstRate !== totalRate
    ) {
      add("igstRate", "IGST must equal the total rate")
    }

    if (
      values.effectiveTo &&
      values.effectiveFrom &&
      values.effectiveTo < values.effectiveFrom
    ) {
      add("effectiveTo", "Effective to must not precede effective from")
    }

    const needsRate =
      values.cessType === "PERCENTAGE" || values.cessType === "BOTH"
    const needsAmount =
      values.cessType === "FIXED_AMOUNT" || values.cessType === "BOTH"
    if (needsRate && values.cessRate === undefined)
      add("cessRate", "Cess rate is required for this cess type")
    if (!needsRate && values.cessRate !== undefined)
      add("cessRate", "Cess rate is only allowed for a percentage cess")
    if (needsAmount && values.cessAmount === undefined)
      add("cessAmount", "Cess amount is required for this cess type")
    if (!needsAmount && values.cessAmount !== undefined)
      add("cessAmount", "Cess amount is only allowed for a fixed cess")
    if (values.cessAmountBasis && !needsAmount)
      add("cessAmountBasis", "Cess amount basis requires a fixed cess amount")

    if (isNewVersion && source) {
      if (values.effectiveFrom < todayISO())
        add("effectiveFrom", "Effective from must be today or later")
      if (source.effectiveFrom && values.effectiveFrom <= source.effectiveFrom)
        add(
          "effectiveFrom",
          `Must start after ${formatDate(source.effectiveFrom)}`
        )
      if (source.effectiveTo && values.effectiveFrom <= source.effectiveTo)
        add(
          "effectiveFrom",
          `Must start after ${formatDate(source.effectiveTo)}`
        )
    }
  })
}

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

  const schema = useMemo(
    () => buildTaxCodeSchema(isNewVersion, source ?? null),
    [isNewVersion, source]
  )

  const { handleSubmit, control, reset, setValue, getValues, setError } =
    useForm<TaxCodeFormValues>({
      resolver: zodResolver(schema),
      defaultValues: toFormDefaults(),
    })

  // Keep CGST and SGST in sync (intra-state rates are always equal).
  const cgstRate = useWatch({ control, name: "cgstRate" })
  const sgstRate = useWatch({ control, name: "sgstRate" })
  const totalRate = useWatch({ control, name: "totalRate" })
  const cessType = useWatch({ control, name: "cessType" })
  const cessNeedsRate = cessType === "PERCENTAGE" || cessType === "BOTH"
  const cessNeedsAmount = cessType === "FIXED_AMOUNT" || cessType === "BOTH"
  const prevRates = useRef<{
    cgst: number | undefined
    sgst: number | undefined
  }>({ cgst: undefined, sgst: undefined })
  const prevTotalRate = useRef<string | number | undefined>(undefined)
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
      const total = rateToForm(source.totalRate)
      reset({
        taxCode: source.taxCode,
        description: source.description ?? "",
        totalRate: total,
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
      prevTotalRate.current = total
    } else {
      reset(toFormDefaults())
      prevTotalRate.current = undefined
    }
  }, [open, isNewVersion, source, reset])

  // Filling the total rate auto-completes the GST split: CGST and SGST each
  // get half of the total (intra-state), while IGST mirrors the full rate
  // (inter-state).
  useEffect(() => {
    // Read the live form value so a programmatic reset (defaults or a new
    // version prefill) is never mistaken for a user edit. Number inputs hand
    // back strings at runtime, so treat the value as unknown here.
    const currentTotal: unknown = getValues("totalRate")
    if (currentTotal === prevTotalRate.current) return
    prevTotalRate.current = currentTotal as string | number | undefined

    const numericTotal = Number(currentTotal)
    if (
      currentTotal === undefined ||
      currentTotal === null ||
      currentTotal === "" ||
      !Number.isFinite(numericTotal)
    ) {
      setValue("cgstRate", undefined, { shouldValidate: true })
      setValue("sgstRate", undefined, { shouldValidate: true })
      setValue("igstRate", undefined, { shouldValidate: true })
      return
    }

    const half = round4(numericTotal / 2)
    setValue("cgstRate", half, { shouldValidate: true })
    setValue("sgstRate", half, { shouldValidate: true })
    setValue("igstRate", numericTotal, { shouldValidate: true })
  }, [totalRate, getValues, setValue])

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
          onError: (error) => {
            applyApiFieldErrors(error, setError)
            toast.error(getApiErrorMessage(error, "Failed"))
          },
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
        onError: (error) => {
          applyApiFieldErrors(error, setError)
          toast.error(getApiErrorMessage(error, "Failed"))
        },
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
                  label={requiredLabel("Tax Code", !isNewVersion)}
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
              <p className="mb-3 text-xs text-muted-foreground">
                Entering the Total Rate auto-fills CGST and SGST (half each) and
                IGST (full rate).
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <FormPercentageField
                  control={control}
                  name="totalRate"
                  label={requiredLabel("Total Rate")}
                />
                <FormPercentageField
                  control={control}
                  name="cgstRate"
                  label={requiredLabel("CGST Rate")}
                />
                <FormPercentageField
                  control={control}
                  name="sgstRate"
                  label={requiredLabel("SGST Rate")}
                />
                <FormPercentageField
                  control={control}
                  name="igstRate"
                  label={requiredLabel("IGST Rate")}
                />
              </div>
            </FieldSet>

            <FieldSet>
              <FieldLegend className="mb-3">Cess</FieldLegend>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormSelectField
                  control={control}
                  name="cessType"
                  label={requiredLabel("Cess Type")}
                  options={cessTypeOptions}
                />
                <FormPercentageField
                  control={control}
                  name="cessRate"
                  label={requiredLabel("Cess Rate", cessNeedsRate)}
                />
                <FormNumberField
                  control={control}
                  name="cessAmount"
                  label={requiredLabel("Cess Amount", cessNeedsAmount)}
                  min={0}
                />
              </div>
              <FormTextField
                control={control}
                name="cessAmountBasis"
                label="Cess Amount Basis"
              />
              <p className="text-xs text-muted-foreground">
                Only for a fixed cess amount. Allowed values:{" "}
                {CESS_AMOUNT_BASES.join(", ")}.
              </p>
            </FieldSet>

            <FieldSet>
              <FieldLegend className="mb-3">Validity</FieldLegend>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormDateField
                  control={control}
                  name="effectiveFrom"
                  label={requiredLabel("Effective From")}
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
