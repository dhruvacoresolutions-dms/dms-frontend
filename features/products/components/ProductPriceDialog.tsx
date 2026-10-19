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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FieldGroup } from "@/components/ui/field"
import {
  FormTextField,
  FormDateField,
  FormComboboxField,
  requiredLabel,
} from "@/components/common/form-fields"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { applyApiFieldErrors } from "@/lib/api/form-errors"
import {
  useCreateProductPrice,
  useReviseProductPrice,
} from "../hooks/use-product-prices"
import { PriceTypeCombobox } from "./PriceTypeCombobox"
import type { ProductPriceResponse } from "../api/product.types"

const UUID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

const todayIsoDate = () => new Date().toISOString().slice(0, 10)

/**
 * Mirrors the backend `ProductPriceModels.CreateRequest` / `ReviseRequest`
 * contract:
 *  - priceTypeCode @NotBlank @Size(max=50) (create only)
 *  - amount @NotNull @Positive @Digits(integer=14,fraction=4)
 *  - effectiveFrom @NotNull and never before today (`dates`)
 *  - effectiveTo, when set, must be after effectiveFrom
 *  - externalReference @Size(max=100)
 * A revision additionally has to start after the addressed price's
 * `effectiveFrom` and before its `effectiveTo`.
 */
const priceBaseSchema = z.object({
  priceTypeCode: z
    .string()
    .min(1, "Price type is required")
    .max(50, "Price type must not exceed 50 characters"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .regex(
      /^\d{1,14}(\.\d{1,4})?$/,
      "Amount must be a number with up to 14 digits and 4 decimals"
    )
    .refine((value) => Number(value) > 0, "Amount must be greater than 0"),
  effectiveFrom: z.string().min(1, "Effective from is required"),
  effectiveTo: z.string().optional(),
  batchUuid: z
    .string()
    .optional()
    .refine(
      (value) => !value || UUID_PATTERN.test(value),
      "Enter a valid batch UUID"
    ),
  externalReference: z
    .string()
    .max(100, "External reference must not exceed 100 characters")
    .optional(),
})

type PriceFormValues = z.infer<typeof priceBaseSchema>

function buildPriceSchema(current: ProductPriceResponse | null) {
  return priceBaseSchema.superRefine((values, ctx) => {
    const today = todayIsoDate()
    if (values.effectiveFrom && values.effectiveFrom < today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["effectiveFrom"],
        message: "Effective from must be today or later",
      })
    }
    if (
      values.effectiveTo &&
      values.effectiveFrom &&
      values.effectiveTo <= values.effectiveFrom
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["effectiveTo"],
        message: "Effective to must be after effective from",
      })
    }
    if (current && values.effectiveFrom) {
      const currentFrom = current.effectiveFrom
      if (currentFrom && values.effectiveFrom <= currentFrom) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["effectiveFrom"],
          message: `Revision must start after ${currentFrom}`,
        })
      } else if (
        current.effectiveTo &&
        values.effectiveFrom >= current.effectiveTo
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["effectiveFrom"],
          message: `Revision must start before ${current.effectiveTo}`,
        })
      }
    }
  })
}

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

  const resolverSchema = useMemo(() => buildPriceSchema(price ?? null), [price])

  const { handleSubmit, control, reset, setError } = useForm<PriceFormValues>({
    resolver: zodResolver(resolverSchema),
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
        // A revision must start after the current price, so the current start
        // date would always be invalid — default to today and let validation
        // surface any remaining constraint (e.g. bounded current range).
        effectiveFrom: todayIsoDate(),
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
            effectiveFrom: values.effectiveFrom,
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
          onError: (error) => {
            applyApiFieldErrors(error, setError)
            toast.error(getApiErrorMessage(error, "Revise failed"))
          },
        }
      )
      return
    }
    createMutation.mutate(
      {
        priceTypeCode: values.priceTypeCode.trim().toUpperCase(),
        amount: values.amount,
        effectiveFrom: values.effectiveFrom,
        effectiveTo: orUndefined(values.effectiveTo),
        batchUuid: orUndefined(values.batchUuid),
        externalReference: orUndefined(values.externalReference),
      },
      {
        onSuccess: () => {
          toast.success("Price created")
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isRevise ? "Revise Price" : "Add Price"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <FieldGroup>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <FormComboboxField
                control={control}
                name="priceTypeCode"
                label={requiredLabel("Price Type", !isRevise)}
                companyUuid={companyUuid}
                disabled={isRevise}
                Combobox={PriceTypeCombobox}
              />
              <FormTextField
                control={control}
                name="amount"
                label={requiredLabel("Amount")}
                type="text"
              />
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
            {isRevise && price ? (
              <p className="text-xs text-muted-foreground">
                {price.effectiveFrom
                  ? `The revision must start after ${price.effectiveFrom}${
                      price.effectiveTo
                        ? ` and before ${price.effectiveTo}`
                        : ""
                    }. `
                  : ""}
                Revising closes the current price on the new start date.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Effective from must be today or later.
              </p>
            )}
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
