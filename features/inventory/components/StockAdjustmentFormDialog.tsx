"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { toast } from "sonner"
import { Info, Plus, Trash2, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import {
  FormDateField,
  FormSelectField,
  FormTextareaField,
  FormTextField,
  requiredLabel,
} from "@/components/common/form-fields"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { applyApiFieldErrors } from "@/lib/api/form-errors"
import { useAvailableQuantity } from "../hooks/use-available-quantity"
import { useCreateStockAdjustment } from "../hooks/use-create-stock-adjustment"
import { useStockAdjustmentReasons } from "../hooks/use-stock-adjustment-reasons"
import { GodownCombobox } from "./GodownCombobox"
import { ScopedProductCombobox } from "./ScopedProductCombobox"
import { StockTypeSelect } from "./stock-type-select"
import type {
  CreateStockAdjustmentRequest,
  StockDirection,
  StockDocument,
  StockTransactionType,
} from "../api/inventory.types"

const TRANSACTION_TYPES: {
  value: StockTransactionType
  label: string
  direction: StockDirection
}[] = [
  { value: "OPENING_STOCK", label: "Opening Stock", direction: "IN" },
  { value: "STOCK_IN", label: "Stock In", direction: "IN" },
  { value: "STOCK_OUT", label: "Stock Out", direction: "OUT" },
]

const FALLBACK_REASONS = [
  "Opening Stock",
  "Purchase Receipt",
  "Customer Return",
  "Damage",
  "Expiry",
  "Count Correction",
  "Other",
]

const lineSchema = z.object({
  productUuid: z.string().min(1, "Select a product"),
  stockType: z.string().min(1, "Select a stock type"),
  quantity: z.coerce
    .number({ invalid_type_error: "Enter a quantity" })
    .int("Quantity must be a whole number")
    .positive("Quantity must be greater than zero"),
})

const formSchema = z
  .object({
    godownUuid: z.string().min(1, "Select a godown"),
    adjustmentDate: z.string().min(1, "Select an adjustment date"),
    transactionType: z.enum(["OPENING_STOCK", "STOCK_IN", "STOCK_OUT"]),
    reason: z.string().trim().min(1, "Select a reason"),
    remarks: z
      .string()
      .trim()
      .max(1000, "Remarks must not exceed 1000 characters")
      .optional(),
    documentNumber: z
      .string()
      .trim()
      .max(120, "Document number must not exceed 120 characters")
      .optional(),
    lines: z.array(lineSchema).min(1, "Add at least one product line"),
  })
  .superRefine((values, ctx) => {
    const seen = new Map<string, number>()
    values.lines.forEach((line, index) => {
      if (!line.productUuid || !line.stockType) return
      const key = `${line.productUuid}:${line.stockType}`
      const first = seen.get(key)
      if (first !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lines", index, "stockType"],
          message: "This product and stock type is already added",
        })
      } else {
        seen.set(key, index)
      }
    })
  })

type FormValues = z.infer<typeof formSchema>

function emptyLine(): FormValues["lines"][number] {
  return { productUuid: "", stockType: "", quantity: 1 }
}

function defaultValues(godownUuid?: string | null): FormValues {
  return {
    godownUuid: godownUuid ?? "",
    adjustmentDate: format(new Date(), "yyyy-MM-dd"),
    transactionType: "STOCK_IN",
    reason: "",
    remarks: "",
    documentNumber: "",
    lines: [emptyLine()],
  }
}

function directionFor(type: StockTransactionType): StockDirection {
  return TRANSACTION_TYPES.find((item) => item.value === type)?.direction ?? "IN"
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  distributorUuid: string
  /** Preselect the godown filter, when one is active on the list. */
  defaultGodownUuid?: string | null
  onCreated?: (document: StockDocument) => void
}

export function StockAdjustmentFormDialog({
  open,
  onOpenChange,
  companyUuid,
  distributorUuid,
  defaultGodownUuid,
  onCreated,
}: Props) {
  const [discardOpen, setDiscardOpen] = useState(false)
  const createMutation = useCreateStockAdjustment(companyUuid, distributorUuid)
  const reasonsQuery = useStockAdjustmentReasons(companyUuid, distributorUuid)

  const reasonOptions = useMemo(() => {
    const reasons = reasonsQuery.data?.length
      ? reasonsQuery.data
      : FALLBACK_REASONS
    return reasons
      .filter((reason) => reason !== "Import")
      .map((reason) => ({ value: reason, label: reason }))
  }, [reasonsQuery.data])

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues(defaultGodownUuid),
  })

  const { fields, append, remove } = useFieldArray({ control, name: "lines" })

  const godownUuid = useWatch({ control, name: "godownUuid" })
  const transactionType = useWatch({ control, name: "transactionType" })
  const lines = useWatch({ control, name: "lines" })
  const direction = directionFor(transactionType)

  useEffect(() => {
    if (!open) return
    reset(defaultValues(defaultGodownUuid))
  }, [open, defaultGodownUuid, reset])

  useEffect(() => {
    if (transactionType === "OPENING_STOCK") {
      setValue("reason", "Opening Stock", { shouldValidate: true })
    }
  }, [transactionType, setValue])

  const closeWithoutPrompt = () => {
    reset(defaultValues(defaultGodownUuid))
    onOpenChange(false)
  }

  const handleOpenChange = (next: boolean) => {
    if (next) {
      onOpenChange(true)
      return
    }
    if (isDirty) {
      setDiscardOpen(true)
      return
    }
    closeWithoutPrompt()
  }

  const onSubmit = (values: FormValues) => {
    const input: CreateStockAdjustmentRequest = {
      godownUuid: values.godownUuid,
      adjustmentDate: values.adjustmentDate,
      direction: directionFor(values.transactionType),
      transactionType: values.transactionType,
      reason: values.reason.trim(),
      remarks: values.remarks?.trim() || undefined,
      documentNumber: values.documentNumber?.trim() || undefined,
      lines: values.lines.map((line) => ({
        productUuid: line.productUuid,
        stockType: line.stockType as "S" | "O" | "U" | "P" | "D",
        quantity: line.quantity,
      })),
    }

    createMutation.mutate(input, {
      onSuccess: (document) => {
        toast.success(
          `${document.referenceNo} created in PENDING — stock is updated after approval.`,
          { duration: 7000 }
        )
        reset(defaultValues(defaultGodownUuid))
        onCreated?.(document)
        onOpenChange(false)
      },
      onError: (error) => {
        applyApiFieldErrors(error, setError)
        toast.error(
          getApiErrorMessage(error, "Could not create stock adjustment")
        )
      },
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>New stock adjustment</DialogTitle>
            <DialogDescription>
              Record stock in or stock out against a godown. Manual adjustments
              are created as PENDING and do not change balances until a company
              user approves them.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
            noValidate
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Controller
                control={control}
                name="godownUuid"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>{requiredLabel("Godown")}</FieldLabel>
                    <GodownCombobox
                      companyUuid={companyUuid}
                      distributorUuid={distributorUuid}
                      activeOnly
                      value={field.value || null}
                      onValueChange={(value) => {
                        field.onChange(value ?? "")
                        // Availability and product search are godown-scoped.
                        setValue(
                          "lines",
                          [{ ...emptyLine() }],
                          { shouldValidate: false }
                        )
                      }}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <FormDateField
                control={control}
                name="adjustmentDate"
                label={requiredLabel("Adjustment date")}
                disableFuture
              />
              <FormSelectField
                control={control}
                name="transactionType"
                label={requiredLabel("Transaction type")}
                options={TRANSACTION_TYPES.map((item) => ({
                  value: item.value,
                  label: item.label,
                }))}
                placeholder="Select transaction type"
              />
              <FormSelectField
                control={control}
                name="reason"
                label={requiredLabel("Reason")}
                options={reasonOptions}
                placeholder={
                  reasonsQuery.isLoading ? "Loading reasons…" : "Select reason"
                }
                disabled={reasonsQuery.isLoading}
              />
              <FormTextField
                control={control}
                name="documentNumber"
                label="Document number"
                placeholder="Enter an external document number"
                maxLength={120}
              />
              <div className="flex items-end">
                <p className="flex items-center gap-1.5 pb-2 text-xs text-muted-foreground">
                  <Info className="size-3.5 shrink-0" aria-hidden="true" />
                  {direction === "OUT"
                    ? "Stock Out reduces quantity across batches."
                    : "Stock In adds quantity to the batch-less pool."}
                </p>
              </div>
              <FormTextareaField
                control={control}
                name="remarks"
                label="Remarks"
                placeholder="Optional notes for this adjustment"
                rows={2}
                maxLength={1000}
                className="sm:col-span-2 lg:col-span-3"
              />
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-medium">Products</h3>
                  <p className="text-xs text-muted-foreground">
                    Batch codes are not allowed on manual adjustments.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append(emptyLine())}
                >
                  <Plus className="mr-2 size-4" /> Add product
                </Button>
              </div>

              {errors.lines?.root?.message ? (
                <p className="text-sm text-destructive">
                  {errors.lines.root.message}
                </p>
              ) : null}

              <div className="flex flex-col gap-3">
                {fields.map((field, index) => {
                  const line = lines?.[index]
                  return (
                    <div
                      key={field.id}
                      className="grid gap-3 rounded-lg border bg-muted/10 p-3 sm:grid-cols-12"
                    >
                      <Controller
                        control={control}
                        name={`lines.${index}.productUuid`}
                        render={({ field: productField, fieldState }) => (
                          <Field className="sm:col-span-5">
                            <FieldLabel>{requiredLabel("Product")}</FieldLabel>
                            <ScopedProductCombobox
                              companyUuid={companyUuid}
                              distributorUuid={distributorUuid}
                              godownUuid={godownUuid}
                              value={productField.value || null}
                              onValueChange={(value) =>
                                productField.onChange(value ?? "")
                              }
                              disabled={!godownUuid}
                            />
                            <FieldError errors={[fieldState.error]} />
                          </Field>
                        )}
                      />
                      <Controller
                        control={control}
                        name={`lines.${index}.stockType`}
                        render={({ field: typeField, fieldState }) => (
                          <Field className="sm:col-span-3">
                            <FieldLabel>
                              {requiredLabel("Stock type")}
                            </FieldLabel>
                            <StockTypeSelect
                              companyUuid={companyUuid}
                              distributorUuid={distributorUuid}
                              value={typeField.value}
                              onValueChange={typeField.onChange}
                            />
                            <FieldError errors={[fieldState.error]} />
                          </Field>
                        )}
                      />
                      <Controller
                        control={control}
                        name={`lines.${index}.quantity`}
                        render={({ field: quantityField, fieldState }) => (
                          <Field className="sm:col-span-2">
                            <FieldLabel>{requiredLabel("Quantity")}</FieldLabel>
                            <Input
                              type="number"
                              min={1}
                              step={1}
                              value={quantityField.value ?? ""}
                              onChange={(event) =>
                                quantityField.onChange(event.target.value)
                              }
                              onBlur={quantityField.onBlur}
                              aria-invalid={!!fieldState.error}
                            />
                            <FieldError errors={[fieldState.error]} />
                          </Field>
                        )}
                      />
                      <div className="flex items-end sm:col-span-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Remove product line"
                          onClick={() => remove(index)}
                          disabled={fields.length <= 1}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                      {direction === "OUT" &&
                      line?.productUuid &&
                      line?.stockType ? (
                        <LineAvailability
                          companyUuid={companyUuid}
                          distributorUuid={distributorUuid}
                          godownUuid={godownUuid}
                          productUuid={line.productUuid}
                          stockType={line.stockType}
                          quantity={line.quantity}
                        />
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              <TriangleAlert
                className="mt-0.5 size-3.5 shrink-0"
                aria-hidden="true"
              />
              The adjustment is saved as PENDING for everyone. A company user
              with approval rights must approve it before stock moves.
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <Spinner className="mr-2 size-4" />
                ) : null}
                Create adjustment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title="Discard this adjustment?"
        description="The values you entered will be lost."
        confirmLabel="Discard"
        variant="destructive"
        onConfirm={() => {
          setDiscardOpen(false)
          closeWithoutPrompt()
        }}
      />
    </>
  )
}

function LineAvailability({
  companyUuid,
  distributorUuid,
  godownUuid,
  productUuid,
  stockType,
  quantity,
}: {
  companyUuid: string
  distributorUuid: string
  godownUuid: string
  productUuid: string
  stockType: string
  quantity: number | string
}) {
  const { data, isFetching } = useAvailableQuantity(
    companyUuid,
    distributorUuid,
    {
      godown: godownUuid,
      product: productUuid,
      stockType: stockType as "S" | "O" | "U" | "P" | "D",
    }
  )

  const available = data?.quantity
  const requested = Number(quantity)
  const shortfall =
    available != null && Number.isFinite(requested) && requested > available

  return (
    <p
      className={
        shortfall
          ? "text-xs font-medium text-destructive sm:col-span-12"
          : "text-xs text-muted-foreground sm:col-span-12"
      }
    >
      {isFetching && available == null
        ? "Checking available stock…"
        : shortfall
          ? `Only ${available} available for this stock type — approval will fail with INSUFFICIENT_STOCK.`
          : `Available: ${available ?? 0}`}
    </p>
  )
}
