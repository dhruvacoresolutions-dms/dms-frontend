"use client"

import { useEffect, useRef } from "react"
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
import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field"
import {
  FormDateField,
  FormNumberField,
  FormPercentageField,
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
  cgstRate: optionalRate,
  sgstRate: optionalRate,
  igstRate: optionalRate,
  cessRate: optionalRate,
  cessAmount: optionalRate,
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
    cgstRate: undefined,
    sgstRate: undefined,
    igstRate: undefined,
    cessRate: undefined,
    cessAmount: undefined,
    effectiveFrom: todayISO(),
    effectiveTo: "",
  }
}

function todayISO(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}

const rateToForm = (v: number | null | undefined) =>
  typeof v === "number" ? v : undefined
const rateToPayload = (v: number | undefined) =>
  typeof v === "number" && !Number.isNaN(v) ? v : null
const emptyToNull = (v?: string) => (v?.trim() ? v.trim() : null)

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

  const { handleSubmit, control, reset, watch, setValue } =
    useForm<TaxStructureFormValues>({
      resolver: zodResolver(taxStructureSchema),
      defaultValues: toFormDefaults(),
    })

  // Keep CGST and SGST in sync (intra-state rates are always equal).
  // Whichever field the user edits wins; the other follows.
  const cgstRate = watch("cgstRate")
  const sgstRate = watch("sgstRate")
  const prevRates = useRef<{ cgst: number | undefined; sgst: number | undefined }>({
    cgst: undefined,
    sgst: undefined,
  })
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
    if (isEdit) {
      if (taxStructure) {
        reset({
          taxType: taxStructure.taxType,
          taxCode: taxStructure.taxCode,
          cgstRate: rateToForm(taxStructure.cgstRate),
          sgstRate: rateToForm(taxStructure.sgstRate),
          igstRate: rateToForm(taxStructure.igstRate),
          cessRate: rateToForm(taxStructure.cessRate),
          cessAmount: rateToForm(taxStructure.cessAmount),
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
    cgstRate: rateToPayload(values.cgstRate),
    sgstRate: rateToPayload(values.sgstRate),
    igstRate: rateToPayload(values.igstRate),
    cessRate: rateToPayload(values.cessRate),
    cessAmount: rateToPayload(values.cessAmount),
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FieldGroup className="gap-8">
              <FieldSet>
                <FieldLegend className="mb-3">Basic Details</FieldLegend>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                </div>
              </FieldSet>

              <FieldSet>
                <FieldLegend className="mb-3">GST Rates (%)</FieldLegend>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              </FieldSet>

              <FieldSet>
                <FieldLegend className="mb-3">Validity</FieldLegend>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
