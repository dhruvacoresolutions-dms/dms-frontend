"use client"

import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
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
import { FieldGroup } from "@/components/ui/field"
import {
  FormDateField,
  FormTextareaField,
} from "@/components/common/form-fields"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { applyApiFieldErrors } from "@/lib/api/form-errors"
import { formatDate } from "@/lib/format"
import { usePatchGstTaxCodeVersion } from "../hooks/use-patch-gst-tax-code-version"
import type { GstTaxCodeResponse } from "../api/gst-tax-code.types"

const baseSchema = z.object({
  description: z
    .string()
    .trim()
    .max(500, "Description must not exceed 500 characters")
    .optional(),
  effectiveTo: z.string().optional(),
})

type FormValues = z.infer<typeof baseSchema>

/**
 * Mirrors `GstTaxService.patch`: only description/status/effectiveTo can change,
 * `effectiveTo` cannot be cleared or extended — it may only be shortened inside
 * the version's existing range.
 */
function buildSchema(source: GstTaxCodeResponse | null) {
  return baseSchema.superRefine((values, ctx) => {
    if (!values.effectiveTo) return
    if (source?.effectiveFrom && values.effectiveTo < source.effectiveFrom) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["effectiveTo"],
        message: `Must be on or after ${formatDate(source.effectiveFrom)}`,
      })
    }
    if (source?.effectiveTo && values.effectiveTo > source.effectiveTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["effectiveTo"],
        message: `May only be shortened; the current end date is ${formatDate(source.effectiveTo)}`,
      })
    }
  })
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  /** The version being patched. */
  source: GstTaxCodeResponse | null
}

/**
 * Partial update of a single version. Rates are immutable within a version —
 * use "New Version" to change them.
 */
export function GstTaxCodeEditDialog({
  open,
  onOpenChange,
  companyUuid,
  source,
}: Props) {
  const patchMutation = usePatchGstTaxCodeVersion(companyUuid)
  const schema = useMemo(() => buildSchema(source), [source])
  const { handleSubmit, control, reset, setError } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { description: "", effectiveTo: "" },
  })

  useEffect(() => {
    if (!open) return
    reset({
      description: source?.description ?? "",
      effectiveTo: source?.effectiveTo ?? "",
    })
  }, [open, source, reset])

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const onSubmit = (values: FormValues) => {
    if (!source) return
    const effectiveTo = values.effectiveTo?.trim()
    patchMutation.mutate(
      {
        versionUuid: source.taxVersionUuid,
        taxCode: source.taxCode,
        input: {
          description: values.description?.trim()
            ? values.description.trim()
            : null,
          // Omitting the key leaves the current end date untouched; sending null
          // is rejected by the backend ("effectiveTo cannot be cleared").
          ...(effectiveTo ? { effectiveTo } : {}),
        },
      },
      {
        onSuccess: () => {
          toast.success("Tax code version updated")
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Tax Code Details</DialogTitle>
          <DialogDescription>
            {source ? `Version ${source.version} of ${source.taxCode}.` : ""}{" "}
            Rates can only be changed by publishing a new version.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <FieldGroup>
            <FormTextareaField
              control={control}
              name="description"
              label="Description"
            />
            <FormDateField
              control={control}
              name="effectiveTo"
              label="Effective To"
            />
            <p className="text-xs text-muted-foreground">
              {source?.effectiveTo
                ? `The end date may only be shortened (currently ${formatDate(source.effectiveTo)}).`
                : "Setting an end date closes this version from that date."}
            </p>
          </FieldGroup>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={patchMutation.isPending}>
              {patchMutation.isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
