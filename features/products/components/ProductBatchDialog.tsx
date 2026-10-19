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
  FormTextField,
  FormDateField,
  requiredLabel,
} from "@/components/common/form-fields"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { applyApiFieldErrors } from "@/lib/api/form-errors"
import {
  useCreateProductBatch,
  useUpdateProductBatch,
} from "../hooks/use-product-batches"
import type { ProductBatchResponse } from "../api/product.types"

/**
 * Mirrors the backend `ProductBatchModels.CreateRequest` / `UpdateRequest`
 * contract: batchNumber @NotBlank @Size(max=100) (create only); manufacturing
 * and expiry dates are optional but a supplied expiry must not precede the
 * manufacturing date (`ProductBatchService.dates`). Batch tracking also has to
 * be enabled on the product (enforced server-side).
 */
const batchSchema = z
  .object({
    batchNumber: z
      .string()
      .trim()
      .min(1, "Batch number is required")
      .max(100, "Batch number must not exceed 100 characters"),
    manufacturingDate: z.string().optional(),
    expiryDate: z.string().optional(),
  })
  .refine(
    (values) =>
      !values.manufacturingDate ||
      !values.expiryDate ||
      values.expiryDate >= values.manufacturingDate,
    {
      path: ["expiryDate"],
      message: "Expiry date must not precede manufacturing date",
    }
  )

type BatchFormValues = z.infer<typeof batchSchema>

type ProductBatchDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  productUuid: string
  batch?: ProductBatchResponse | null
}

export function ProductBatchDialog({
  open,
  onOpenChange,
  companyUuid,
  productUuid,
  batch,
}: ProductBatchDialogProps) {
  const isEdit = !!batch
  const createMutation = useCreateProductBatch(companyUuid, productUuid)
  const updateMutation = useUpdateProductBatch(companyUuid, productUuid)

  const { handleSubmit, control, reset, setError } = useForm<BatchFormValues>({
    resolver: zodResolver(batchSchema),
    defaultValues: { batchNumber: "", manufacturingDate: "", expiryDate: "" },
  })

  useEffect(() => {
    if (!open) return
    reset({
      batchNumber: batch?.batchNumber ?? "",
      manufacturingDate: batch?.manufacturingDate ?? "",
      expiryDate: batch?.expiryDate ?? "",
    })
  }, [open, batch, reset])

  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = (values: BatchFormValues) => {
    const orUndefined = (v?: string) => (v === "" ? undefined : v)
    if (isEdit && batch) {
      updateMutation.mutate(
        {
          batchUuid: batch.batchUuid,
          input: {
            manufacturingDate: orUndefined(values.manufacturingDate),
            expiryDate: orUndefined(values.expiryDate),
            version: batch.version,
          },
        },
        {
          onSuccess: () => {
            toast.success("Batch updated")
            onOpenChange(false)
          },
          onError: (error) => {
            applyApiFieldErrors(error, setError)
            toast.error(getApiErrorMessage(error, "Update failed"))
          },
        }
      )
      return
    }
    createMutation.mutate(
      {
        batchNumber: values.batchNumber,
        manufacturingDate: orUndefined(values.manufacturingDate),
        expiryDate: orUndefined(values.expiryDate),
      },
      {
        onSuccess: () => {
          toast.success("Batch created")
          onOpenChange(false)
        },
        onError: (error) => {
          applyApiFieldErrors(error, setError)
          toast.error(getApiErrorMessage(error, "Creation failed"))
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Batch" : "Add Batch"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <FieldGroup>
            <FormTextField
              control={control}
              name="batchNumber"
              label={requiredLabel("Batch Number", !isEdit)}
              disabled={isEdit}
            />
            <FormDateField
              control={control}
              name="manufacturingDate"
              label="Manufacturing Date"
            />
            <FormDateField
              control={control}
              name="expiryDate"
              label="Expiry Date"
            />
            <p className="text-xs text-muted-foreground">
              The product must have batch tracking enabled.
            </p>
          </FieldGroup>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Save changes" : "Add batch"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
