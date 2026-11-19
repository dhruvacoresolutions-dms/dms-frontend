"use client"

import { useEffect, useState } from "react"
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
import { ArrowRight, Info, Plus, Trash2, TriangleAlert } from "lucide-react"

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
  FormTextareaField,
  FormTextField,
  requiredLabel,
} from "@/components/common/form-fields"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { applyApiFieldErrors } from "@/lib/api/form-errors"
import { useAvailableQuantity } from "../hooks/use-available-quantity"
import { useCreateStockTransfer } from "../hooks/use-create-stock-transfer"
import { GodownCombobox } from "./GodownCombobox"
import { ScopedProductCombobox } from "./ScopedProductCombobox"
import { StockTypeSelect } from "./stock-type-select"
import type {
  CreateStockTransferRequest,
  StockDocument,
} from "../api/inventory.types"

const lineSchema = z
  .object({
    productUuid: z.string().min(1, "Select a product"),
    fromType: z.string().min(1, "Select the source stock type"),
    toType: z.string().min(1, "Select the destination stock type"),
    quantity: z.coerce
      .number({ invalid_type_error: "Enter a quantity" })
      .int("Quantity must be a whole number")
      .positive("Quantity must be greater than zero"),
  })
  .refine((line) => line.fromType !== line.toType, {
    path: ["toType"],
    message: "Source and destination stock types must differ",
  })

const formSchema = z
  .object({
    godownUuid: z.string().min(1, "Select a godown"),
    transferDate: z.string().min(1, "Select a transfer date"),
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
    const seen = new Set<string>()
    values.lines.forEach((line, index) => {
      if (!line.productUuid || !line.fromType || !line.toType) return
      const key = `${line.productUuid}:${line.fromType}:${line.toType}`
      if (seen.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lines", index, "toType"],
          message: "This product and movement is already added",
        })
      } else {
        seen.add(key)
      }
    })
  })

type FormValues = z.infer<typeof formSchema>

function emptyLine(): FormValues["lines"][number] {
  return { productUuid: "", fromType: "S", toType: "U", quantity: 1 }
}

function defaultValues(godownUuid?: string | null): FormValues {
  return {
    godownUuid: godownUuid ?? "",
    transferDate: format(new Date(), "yyyy-MM-dd"),
    remarks: "",
    documentNumber: "",
    lines: [emptyLine()],
  }
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  distributorUuid: string
  defaultGodownUuid?: string | null
  onCreated?: (document: StockDocument) => void
}

export function StockTransferFormDialog({
  open,
  onOpenChange,
  companyUuid,
  distributorUuid,
  defaultGodownUuid,
  onCreated,
}: Props) {
  const [discardOpen, setDiscardOpen] = useState(false)
  const createMutation = useCreateStockTransfer(companyUuid, distributorUuid)

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
  const lines = useWatch({ control, name: "lines" })

  useEffect(() => {
    if (!open) return
    reset(defaultValues(defaultGodownUuid))
  }, [open, defaultGodownUuid, reset])

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
    const input: CreateStockTransferRequest = {
      godownUuid: values.godownUuid,
      transferDate: values.transferDate,
      remarks: values.remarks?.trim() || undefined,
      documentNumber: values.documentNumber?.trim() || undefined,
      lines: values.lines.map((line) => ({
        productUuid: line.productUuid,
        fromType: line.fromType as "S" | "O" | "U" | "P" | "D",
        toType: line.toType as "S" | "O" | "U" | "P" | "D",
        quantity: line.quantity,
      })),
    }

    createMutation.mutate(input, {
      onSuccess: (document) => {
        if (document.status === "APPROVED") {
          toast.success(`${document.referenceNo} approved — stock moved.`)
        } else {
          toast.success(
            `${document.referenceNo} created in PENDING — awaiting company approval.`,
            { duration: 7000 }
          )
        }
        reset(defaultValues(defaultGodownUuid))
        onCreated?.(document)
        onOpenChange(false)
      },
      onError: (error) => {
        applyApiFieldErrors(error, setError)
        toast.error(getApiErrorMessage(error, "Could not create stock transfer"))
      },
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>New stock transfer</DialogTitle>
            <DialogDescription>
              Move quantity between stock types in the same godown. Any two
              different stock types are allowed; batch codes are not.
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
                        setValue("lines", [{ ...emptyLine() }], {
                          shouldValidate: false,
                        })
                      }}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <FormDateField
                control={control}
                name="transferDate"
                label={requiredLabel("Transfer date")}
                disableFuture
              />
              <FormTextField
                control={control}
                name="documentNumber"
                label="Document number"
                placeholder="Enter an external document number"
                maxLength={120}
              />
              <FormTextareaField
                control={control}
                name="remarks"
                label="Remarks"
                placeholder="Optional notes for this transfer"
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
                    Quantity is consumed from the source type and added to the
                    destination type when approved.
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
                          <Field className="sm:col-span-4">
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
                        name={`lines.${index}.fromType`}
                        render={({ field: typeField, fieldState }) => (
                          <Field className="sm:col-span-3">
                            <FieldLabel>{requiredLabel("From type")}</FieldLabel>
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
                      <div className="hidden items-end justify-center pb-2 sm:col-span-1 sm:flex">
                        <ArrowRight
                          className="size-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </div>
                      <Controller
                        control={control}
                        name={`lines.${index}.toType`}
                        render={({ field: typeField, fieldState }) => (
                          <Field className="sm:col-span-3">
                            <FieldLabel>{requiredLabel("To type")}</FieldLabel>
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
                          <Field className="sm:col-span-1">
                            <FieldLabel>{requiredLabel("Qty")}</FieldLabel>
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
                      <div className="flex items-end sm:col-span-12">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          disabled={fields.length <= 1}
                        >
                          <Trash2 className="mr-1 size-3.5" /> Remove
                        </Button>
                      </div>
                      {line?.productUuid && line?.fromType ? (
                        <LineAvailability
                          companyUuid={companyUuid}
                          distributorUuid={distributorUuid}
                          godownUuid={godownUuid}
                          productUuid={line.productUuid}
                          stockType={line.fromType}
                          quantity={line.quantity}
                        />
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              Distributor-created transfers stay PENDING. Company users with
              transfer approval rights may have theirs auto-approved and stock
              posted immediately.
            </div>

            {errors.lines?.root?.message ? (
              <p className="flex items-center gap-1.5 text-sm text-destructive">
                <TriangleAlert className="size-4" />
                {errors.lines.root.message}
              </p>
            ) : null}

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
                Create transfer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title="Discard this transfer?"
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
        ? "Checking source stock…"
        : shortfall
          ? `Only ${available} available in the source type — approval will fail with INSUFFICIENT_STOCK.`
          : `Available in source type: ${available ?? 0}`}
    </p>
  )
}
