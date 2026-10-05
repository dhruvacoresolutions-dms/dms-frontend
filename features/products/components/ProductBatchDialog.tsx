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
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { getApiErrorMessage } from "@/lib/api/api-error"
import {
  useCreateProductBatch,
  useUpdateProductBatch,
} from "../hooks/use-product-batches"
import type { ProductBatchResponse } from "../api/product.types"

const batchSchema = z.object({
  batchNumber: z.string().min(1, "Batch number is required").max(100),
  manufacturingDate: z.string().optional(),
  expiryDate: z.string().optional(),
})

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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BatchFormValues>({
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
          onError: (error) =>
            toast.error(getApiErrorMessage(error, "Update failed")),
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
        onError: (error) =>
          toast.error(getApiErrorMessage(error, "Creation failed")),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Batch" : "Add Batch"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel>Batch Number *</FieldLabel>
              <Input
                placeholder="e.g. BATCH-2026-001"
                {...register("batchNumber")}
                disabled={isEdit}
                autoComplete="off"
              />
              <FieldError errors={[errors.batchNumber]} />
            </Field>
            <Field>
              <FieldLabel>Manufacturing Date</FieldLabel>
              <Input type="date" {...register("manufacturingDate")} />
              <FieldError errors={[errors.manufacturingDate]} />
            </Field>
            <Field>
              <FieldLabel>Expiry Date</FieldLabel>
              <Input type="date" {...register("expiryDate")} />
              <FieldError errors={[errors.expiryDate]} />
            </Field>
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
