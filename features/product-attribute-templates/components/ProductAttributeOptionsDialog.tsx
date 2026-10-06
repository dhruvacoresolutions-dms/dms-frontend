"use client"

import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Pencil, ToggleLeft, ToggleRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { StatusBadge } from "@/components/common/StatusBadge"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import {
  FormNumberField,
  FormTextField,
} from "@/components/common/form-fields"
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

  const { handleSubmit, control, reset } = useForm<OptionFormValues>({
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

  const columns = useMemo<DataTableColumn<ProductAttributeOptionResponse>[]>(
    () => [
      {
        id: "code",
        header: "Code",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.code}</span>
        ),
      },
      {
        id: "label",
        header: "Label",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.label}</span>
        ),
      },
      {
        id: "order",
        header: "Order",
        cell: ({ row }) => row.original.displayOrder,
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const o = row.original
          return (
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
          )
        },
      },
    ],
    []
  )

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
                  <FormTextField
                    control={control}
                    name="code"
                    label="Code"
                    disabled={!!editing}
                  />
                  <FormTextField
                    control={control}
                    name="label"
                    label="Label"
                  />
                  <FormNumberField
                    control={control}
                    name="displayOrder"
                    label="Order"
                    step="1"
                    min={0}
                  />
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

          <DataTable
            columns={columns}
            data={options}
            getRowId={(o) => o.optionUuid}
            isLoading={isLoading}
            skeletonRows={3}
            error={error}
            onRetry={() => void refetch()}
            empty={{
              title: "No options found",
              description: "Add an option to get started.",
            }}
          />
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
