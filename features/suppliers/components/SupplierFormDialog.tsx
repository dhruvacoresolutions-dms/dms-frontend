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
  FormComboboxField,
  FormTextareaField,
  FormTextField,
} from "@/components/common/form-fields"
import { Spinner } from "@/components/ui/spinner"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { GeographyCombobox } from "@/features/geographies/components/GeographyCombobox"
import { useSupplier } from "../hooks/use-supplier"
import { useCreateSupplier } from "../hooks/use-create-supplier"
import { useUpdateSupplier } from "../hooks/use-update-supplier"

const phonePattern = /^$|^\+?[0-9]{7,15}$/

const supplierSchema = z.object({
  supplierCode: z.string().min(1, "Code is required").max(30),
  supplierName: z.string().min(1, "Name is required").max(120),
  gstin: z.string().max(20).optional(),
  addressLine: z.string().max(500).optional(),
  geographyUuid: z.string().optional(),
  postalCode: z.string().max(20).optional(),
  phone: z
    .string()
    .regex(phonePattern, "Enter a valid phone number")
    .optional(),
  contactPerson: z.string().max(120).optional(),
  email: z
    .string()
    .max(254)
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: "Enter a valid email",
    })
    .optional(),
})

type SupplierFormValues = z.infer<typeof supplierSchema>

type SupplierFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  /** When set, the dialog edits that supplier; otherwise it creates one */
  supplierUuid?: string | null
}

function toFormDefaults(): SupplierFormValues {
  return {
    supplierCode: "",
    supplierName: "",
    gstin: "",
    addressLine: "",
    geographyUuid: "",
    postalCode: "",
    phone: "",
    contactPerson: "",
    email: "",
  }
}

export function SupplierFormDialog({
  open,
  onOpenChange,
  companyUuid,
  supplierUuid,
}: SupplierFormDialogProps) {
  const isEdit = !!supplierUuid
  const { data: supplier, isLoading: isDetailLoading } = useSupplier(
    companyUuid,
    supplierUuid ?? ""
  )
  const createMutation = useCreateSupplier(companyUuid)
  const updateMutation = useUpdateSupplier(companyUuid)

  const { handleSubmit, control, reset } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: toFormDefaults(),
  })

  useEffect(() => {
    if (!open) return
    if (isEdit) {
      if (supplier) {
        reset({
          supplierCode: supplier.supplierCode,
          supplierName: supplier.supplierName,
          gstin: supplier.gstin ?? "",
          addressLine: supplier.addressLine ?? "",
          geographyUuid: supplier.geographyUuid ?? "",
          postalCode: supplier.postalCode ?? "",
          phone: supplier.phone ?? "",
          contactPerson: supplier.contactPerson ?? "",
          email: supplier.email ?? "",
        })
      }
    } else {
      reset(toFormDefaults())
    }
  }, [open, isEdit, supplier, reset])

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    (isEdit && isDetailLoading)

  const onSubmit = (values: SupplierFormValues) => {
    const payload = {
      supplierCode: values.supplierCode.trim(),
      supplierName: values.supplierName.trim(),
      gstin: values.gstin?.trim() || undefined,
      addressLine: values.addressLine?.trim() || undefined,
      geographyUuid: values.geographyUuid || undefined,
      postalCode: values.postalCode?.trim() || undefined,
      phone: values.phone?.trim() || undefined,
      contactPerson: values.contactPerson?.trim() || undefined,
      email: values.email?.trim() || undefined,
    }

    if (isEdit) {
      if (!supplierUuid) return
      updateMutation.mutate(
        {
          supplierUuid,
          input: { ...payload, version: supplier?.version },
        },
        {
          onSuccess: () => {
            toast.success("Supplier updated")
            handleOpenChange(false)
          },
          onError: (error) => {
            toast.error(getApiErrorMessage(error, "Failed"))
          },
        }
      )
      return
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Supplier created")
        reset(toFormDefaults())
        handleOpenChange(false)
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, "Failed"))
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Supplier" : "Create Supplier"}
          </DialogTitle>
        </DialogHeader>
        {isEdit && isDetailLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FieldGroup>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <FormTextField
                  control={control}
                  name="supplierCode"
                  label="Code *"
                  maxLength={30}
                />
                <FormTextField
                  control={control}
                  name="supplierName"
                  label="Name *"
                  maxLength={120}
                />
                <FormTextField
                  control={control}
                  name="gstin"
                  label="GSTIN"
                  maxLength={20}
                />
                <FormTextField
                  control={control}
                  name="postalCode"
                  label="Postal Code"
                  maxLength={20}
                />
                <FormComboboxField
                  control={control}
                  name="geographyUuid"
                  label="Geography"
                  companyUuid={companyUuid}
                  Combobox={GeographyCombobox}
                />
                <FormTextField
                  control={control}
                  name="contactPerson"
                  label="Contact Person"
                  maxLength={120}
                />
                <FormTextField
                  control={control}
                  name="phone"
                  label="Phone"
                  placeholder="Enter phone number"
                />
                <FormTextField
                  control={control}
                  name="email"
                  label="Email"
                  type="email"
                  maxLength={254}
                />
                <FormTextareaField
                  control={control}
                  name="addressLine"
                  label="Address"
                  className="lg:col-span-2"
                />
              </div>
            </FieldGroup>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? isEdit
                    ? "Saving..."
                    : "Creating..."
                  : isEdit
                    ? "Save changes"
                    : "Create"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
