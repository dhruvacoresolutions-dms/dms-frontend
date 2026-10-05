"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Pencil, ToggleLeft, ToggleRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge } from "@/components/common/StatusBadge"
import { TableSkeleton } from "@/components/common/LoadingState"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { PERMISSIONS } from "@/lib/permissions"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { useProductAttributeOptions } from "../hooks/use-product-attribute-options"
import { useCreateProductAttributeOption } from "../hooks/use-create-product-attribute-option"
import { useUpdateProductAttributeOption } from "../hooks/use-update-product-attribute-option"
import { useUpdateProductAttributeOptionStatus } from "../hooks/use-update-product-attribute-option-status"
import type { ProductAttributeOptionResponse } from "../api/product-attribute-template.types"

const optionSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(50)
    .regex(/^[A-Za-z0-9_-]+$/, "Invalid code"),
  label: z.string().min(1, "Label is required").max(160),
  displayOrder: z.coerce.number().int().min(0, "Order must be >= 0"),
})

type OptionFormValues = z.infer<typeof optionSchema>

type ProductAttributeOptionsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  attributeTemplateUuid: string | null
  templateLabel?: string
}

export function ProductAttributeOptionsDialog({
  open,
  onOpenChange,
  companyUuid,
  attributeTemplateUuid,
  templateLabel,
}: ProductAttributeOptionsDialogProps) {
  const [editing, setEditing] =
    useState<ProductAttributeOptionResponse | null>(null)
  const [statusToggle, setStatusToggle] =
    useState<ProductAttributeOptionResponse | null>(null)

  const { data, isLoading, error, refetch } = useProductAttributeOptions(
    companyUuid,
    attributeTemplateUuid ?? "",
    { enabled: open && !!attributeTemplateUuid }
  )
  const createMutation = useCreateProductAttributeOption(
    companyUuid,
    attributeTemplateUuid ?? ""
  )
  const updateMutation = useUpdateProductAttributeOption(
    companyUuid,
    attributeTemplateUuid ?? ""
  )
  const statusMutation = useUpdateProductAttributeOptionStatus(
    companyUuid,
    attributeTemplateUuid ?? ""
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OptionFormValues>({
    resolver: zodResolver(optionSchema),
    defaultValues: { code: "", label: "", displayOrder: 0 },
  })

  useEffect(() => {
    if (editing) {
      reset({
        code: editing.code,
        label: editing.label,
        displayOrder: editing.displayOrder,
      })
    } else {
      reset({ code: "", label: "", displayOrder: (data?.length ?? 0) + 1 })
    }
  }, [editing, data, reset])

  const options = data ?? []

  const onSubmit = (values: OptionFormValues) => {
    if (!attributeTemplateUuid) return
    if (editing) {
      updateMutation.mutate(
        {
          optionUuid: editing.optionUuid,
          input: {
            label: values.label,
            displayOrder: values.displayOrder,
            version: editing.version,
          },
        },
        {
          onSuccess: () => {
            toast.success("Option updated")
            setEditing(null)
          },
          onError: (err) => toast.error(getApiErrorMessage(err, "Failed")),
        }
      )
      return
    }
    createMutation.mutate(values, {
      onSuccess: () => {
        toast.success("Option created")
        reset({ code: "", label: "", displayOrder: 0 })
      },
      onError: (err) => toast.error(getApiErrorMessage(err, "Failed")),
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Manage Options{templateLabel ? ` — ${templateLabel}` : ""}
            </DialogTitle>
          </DialogHeader>

          <PermissionGate
            permission={PERMISSIONS.PRODUCT.SUPPORTING_MASTER_CREATE}
          >
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="rounded-md border p-4"
            >
              <FieldGroup>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field>
                    <FieldLabel>Code</FieldLabel>
                    <Input
                      placeholder="e.g. STD"
                      aria-invalid={!!errors.code}
                      {...register("code")}
                      disabled={!!editing}
                      autoComplete="off"
                    />
                    <FieldError errors={[errors.code]} />
                  </Field>
                  <Field>
                    <FieldLabel>Label</FieldLabel>
                    <Input
                      placeholder="e.g. Standard"
                      aria-invalid={!!errors.label}
                      {...register("label")}
                      autoComplete="off"
                    />
                    <FieldError errors={[errors.label]} />
                  </Field>
                  <Field>
                    <FieldLabel>Order</FieldLabel>
                    <Input
                      type="number"
                      min={0}
                      aria-invalid={!!errors.displayOrder}
                      {...register("displayOrder")}
                    />
                    <FieldError errors={[errors.displayOrder]} />
                  </Field>
                </div>
              </FieldGroup>
              <div className="mt-3 flex justify-end gap-2">
                {editing && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditing(null)}
                  >
                    Cancel edit
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {editing ? "Save option" : "Add option"}
                </Button>
              </div>
            </form>
          </PermissionGate>

          {isLoading ? (
            <TableSkeleton rows={3} />
          ) : error ? (
            <ErrorState onRetry={refetch} />
          ) : options.length === 0 ? (
            <EmptyState
              title="No options found"
              description="Add an option to get started."
            />
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {options.map((o) => (
                    <TableRow key={o.optionUuid}>
                      <TableCell className="font-mono text-sm">
                        {o.code}
                      </TableCell>
                      <TableCell className="font-medium">{o.label}</TableCell>
                      <TableCell>{o.displayOrder}</TableCell>
                      <TableCell>
                        <StatusBadge status={o.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <PermissionGate
                            permission={
                              PERMISSIONS.PRODUCT.SUPPORTING_MASTER_UPDATE
                            }
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditing(o)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                          </PermissionGate>
                          <PermissionGate
                            permission={
                              PERMISSIONS.PRODUCT.SUPPORTING_MASTER_STATUS
                            }
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setStatusToggle(o)}
                            >
                              {o.status === "ACTIVE" ? (
                                <ToggleLeft className="size-4" />
                              ) : (
                                <ToggleRight className="size-4" />
                              )}
                            </Button>
                          </PermissionGate>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!statusToggle}
        onOpenChange={(next) => !next && setStatusToggle(null)}
        title="Update Status?"
        description={`This will change the option status to ${
          statusToggle?.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
        }.`}
        confirmLabel="Confirm"
        variant="destructive"
        isLoading={statusMutation.isPending}
        onConfirm={() => {
          if (!statusToggle) return
          statusMutation.mutate(
            {
              optionUuid: statusToggle.optionUuid,
              input: {
                status:
                  statusToggle.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                version: statusToggle.version,
              },
            },
            {
              onSuccess: () => {
                toast.success("Option status updated")
                setStatusToggle(null)
              },
              onError: (err) =>
                toast.error(getApiErrorMessage(err, "Failed")),
            }
          )
        }}
      />
      {statusMutation.isPending && (
        <span className="sr-only">
          <Spinner />
        </span>
      )}
    </>
  )
}
