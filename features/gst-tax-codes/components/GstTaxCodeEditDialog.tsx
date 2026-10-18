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
import { usePatchGstTaxCodeVersion } from "../hooks/use-patch-gst-tax-code-version"
import type { GstTaxCodeResponse } from "../api/gst-tax-code.types"

const schema = z.object({
  description: z.string().max(500).optional(),
  effectiveTo: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

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
  const { handleSubmit, control, reset } = useForm<FormValues>({
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
    patchMutation.mutate(
      {
        versionUuid: source.taxVersionUuid,
        taxCode: source.taxCode,
        input: {
          description: values.description?.trim() ? values.description.trim() : null,
          effectiveTo: values.effectiveTo?.trim() ? values.effectiveTo.trim() : null,
        },
      },
      {
        onSuccess: () => {
          toast.success("Tax code version updated")
          handleOpenChange(false)
        },
        onError: (error) => toast.error(getApiErrorMessage(error, "Failed")),
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
