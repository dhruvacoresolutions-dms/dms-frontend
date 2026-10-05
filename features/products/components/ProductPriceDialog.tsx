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
  FormComboboxField,
} from "@/components/common/form-fields"
import { getApiErrorMessage } from "@/lib/api/api-error"
import {
  useCreateProductPrice,
  useReviseProductPrice,
} from "../hooks/use-product-prices"
import { PriceTypeCombobox } from "./PriceTypeCombobox"
import type { ProductPriceResponse } from "../api/product.types"

const priceSchema = z.object({
  priceTypeCode: z.string().min(1, "Price type is required"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .regex(/^\d+(\.\d{1,4})?$/, "Invalid amount"),
  effectiveFrom: z.string().optional(),
  effectiveTo: z.string().optional(),
  batchUuid: z.string().optional(),
  externalReference: z.string().max(120).optional(),
})

type PriceFormValues = z.infer<typeof priceSchema>

type ProductPriceDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  productUuid: string
  /** When set, revises that price; otherwise creates one */
  price?: ProductPriceResponse | null
}

export function ProductPriceDialog({
  open,
  onOpenChange,
  companyUuid,
  productUuid,
  price,
}: ProductPriceDialogProps) {
  const isRevise = !!price
  const createMutation = useCreateProductPrice(companyUuid, productUuid)
  const reviseMutation = useReviseProductPrice(companyUuid, productUuid)

  const { handleSubmit, control, reset } = useForm<PriceFormValues>({
    resolver: zodResolver(priceSchema),
    defaultValues: {
      priceTypeCode: "",
      amount: "",
      effectiveFrom: "",
      effectiveTo: "",
      batchUuid: "",
      externalReference: "",
    },
  })

  useEffect(() => {
    if (!open) return
    if (price) {
      reset({
        priceTypeCode: price.priceTypeCode,
        amount: price.amount,
        effectiveFrom: price.effectiveFrom ?? "",
        effectiveTo: price.effectiveTo ?? "",
        batchUuid: "",
        externalReference: price.externalReference ?? "",
      })
    } else {
      reset({
        priceTypeCode: "",
        amount: "",
        effectiveFrom: "",
        effectiveTo: "",
        batchUuid: "",
        externalReference: "",
      })
    }
  }, [open, price, reset])

  const isPending = createMutation.isPending || reviseMutation.isPending

  const onSubmit = (values: PriceFormValues) => {
    const orUndefined = (v?: string) => (v === "" ? undefined : v)
    if (isRevise && price) {
      reviseMutation.mutate(
        {
          priceUuid: price.priceUuid,
          input: {
            amount: values.amount,
            effectiveFrom: orUndefined(values.effectiveFrom),
            effectiveTo: orUndefined(values.effectiveTo) ?? null,
            externalReference: orUndefined(values.externalReference),
            version: price.version,
          },
        },
        {
          onSuccess: () => {
            toast.success("Price revised")
            onOpenChange(false)
          },
          onError: (error) =>
            toast.error(getApiErrorMessage(error, "Revise failed")),
        }
      )
      return
    }
    createMutation.mutate(
      {
        priceTypeCode: values.priceTypeCode,
        amount: values.amount,
        effectiveFrom: orUndefined(values.effectiveFrom),
        effectiveTo: orUndefined(values.effectiveTo),
        batchUuid: orUndefined(values.batchUuid),
        externalReference: orUndefined(values.externalReference),
      },
      {
        onSuccess: () => {
          toast.success("Price created")
          onOpenChange(false)
        },
        onError: (error) =>
          toast.error(getApiErrorMessage(error, "Creation failed")),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isRevise ? "Revise Price" : "Add Price"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <FormComboboxField
                control={control}
                name="priceTypeCode"
                label="Price Type *"
                companyUuid={companyUuid}
                disabled={isRevise}
                Combobox={PriceTypeCombobox}
              />
              <FormTextField
                control={control}
                name="amount"
                label="Amount *"
                type="text"
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
              {!isRevise && (
                <FormTextField
                  control={control}
                  name="batchUuid"
                  label="Batch UUID (optional)"
                />
              )}
              <FormTextField
                control={control}
                name="externalReference"
                label="External Reference"
              />
            </div>
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
              {isPending
                ? isRevise
                  ? "Revising..."
                  : "Creating..."
                : isRevise
                  ? "Revise price"
                  : "Add price"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
