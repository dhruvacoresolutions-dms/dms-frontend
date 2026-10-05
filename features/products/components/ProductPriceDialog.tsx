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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { getApiErrorMessage } from "@/lib/api/api-error"
import {
  usePriceTypes,
  useCreateProductPrice,
  useReviseProductPrice,
} from "../hooks/use-product-prices"
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
  const { data: priceTypesData } = usePriceTypes(companyUuid)
  const createMutation = useCreateProductPrice(companyUuid, productUuid)
  const reviseMutation = useReviseProductPrice(companyUuid, productUuid)

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<PriceFormValues>({
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

  const priceTypeCode = useWatch({ control, name: "priceTypeCode" })
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
        {!priceTypesData ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FieldGroup>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Field>
                  <FieldLabel>Price Type *</FieldLabel>
                  <Select
                    value={priceTypeCode || ""}
                    disabled={isRevise}
                    onValueChange={(v: string | null) => {
                      if (v) setValue("priceTypeCode", v, { shouldValidate: true })
                      }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select price type" />
                    </SelectTrigger>
                    <SelectContent>
                      {(priceTypesData?.content ?? []).map((pt) => (
                        <SelectItem key={pt.priceTypeUuid} value={pt.code}>
                          {pt.name} ({pt.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={[errors.priceTypeCode]} />
                </Field>
                <Field>
                  <FieldLabel>Amount *</FieldLabel>
                  <Input
                    placeholder="e.g. 125.50"
                    inputMode="decimal"
                    {...register("amount")}
                    autoComplete="off"
                  />
                  <FieldError errors={[errors.amount]} />
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
                {!isRevise && (
                  <Field>
                    <FieldLabel>Batch UUID (optional)</FieldLabel>
                    <Input
                      placeholder="Leave empty for base price"
                      {...register("batchUuid")}
                      autoComplete="off"
                    />
                    <FieldError errors={[errors.batchUuid]} />
                  </Field>
                )}
                <Field>
                  <FieldLabel>External Reference</FieldLabel>
                  <Input
                    placeholder="e.g. ERP-PRICE-0001"
                    {...register("externalReference")}
                    autoComplete="off"
                  />
                  <FieldError errors={[errors.externalReference]} />
                </Field>
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
        )}
      </DialogContent>
    </Dialog>
  )
}
