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
  requiredLabel,
} from "@/components/common/form-fields"
import { Spinner } from "@/components/ui/spinner"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { applyApiFieldErrors } from "@/lib/api/form-errors"
import {
  optionalName,
  optionalText,
  requiredCode,
  requiredName,
} from "@/lib/validations/master-data"
import {
  optionalEmail,
  optionalGstin,
  optionalPhone,
  requiredPan,
} from "@/lib/validations/party"
import { GeographyCombobox } from "@/features/geographies/components/GeographyCombobox"
import { useSupplier } from "../hooks/use-supplier"
import { useCreateSupplier } from "../hooks/use-create-supplier"
import { useUpdateSupplier } from "../hooks/use-update-supplier"

/**
 * Mirrors `CreateSupplierRequest` / `UpdateSupplierRequest`:
 *  - supplierCode   @NotBlank @Size(max=30) @SafeCode (immutable? no, editable)
 *  - supplierName   @NotBlank @Size(max=120) @SafeName
 *  - addressLine    @NotBlank @Size(max=500)
 *  - pan            @NotBlank `^[A-Za-z]{5}[0-9]{4}[A-Za-z]$`
 *  - postalCode     @Size(max=20), phone `^\+?[0-9]{7,15}$`
 *  - contactPerson  @Size(max=120) @SafeName, email @Email @Size(max=254)
 *  - gstin          optional, must pass `GstinValidator`
 *  - addressLine2/3 @Size(max=500)
 * The optional bank account is not edited from this dialog.
 */
const supplierSchema = z.object({
  supplierCode: requiredCode("Code", 30),
  supplierName: requiredName("Name", 120),
  gstin: optionalGstin("GSTIN"),
  pan: requiredPan("PAN"),
  addressLine: z
    .string()
    .trim()
    .min(1, "Address is required")
    .max(500, "Address must not exceed 500 characters"),
  addressLine2: optionalText("Address line 2", 500),
  addressLine3: optionalText("Address line 3", 500),
  geographyUuid: z.string().optional(),
  postalCode: optionalText("Postal code", 20),
  phone: optionalPhone("phone number"),
  contactPerson: optionalName("Contact person", 120),
  email: optionalEmail(254),
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
    pan: "",
    addressLine: "",
    addressLine2: "",
    addressLine3: "",
    geographyUuid: "",
    postalCode: "",
    phone: "",
    contactPerson: "",
    email: "",
  }
}

const upper = (value?: string) => {
  const normalized = value?.trim()
  return normalized ? normalized.toUpperCase() : undefined
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

  const { handleSubmit, control, reset, setError } =
    useForm<SupplierFormValues>({
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
          pan: supplier.pan ?? "",
          addressLine: supplier.addressLine ?? "",
          addressLine2: supplier.addressLine2 ?? "",
          addressLine3: supplier.addressLine3 ?? "",
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
      supplierCode: values.supplierCode.trim().toUpperCase(),
      supplierName: values.supplierName.trim(),
      gstin: upper(values.gstin),
      pan: values.pan.trim().toUpperCase(),
      addressLine: values.addressLine.trim(),
      addressLine2: values.addressLine2?.trim() || undefined,
      addressLine3: values.addressLine3?.trim() || undefined,
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
            applyApiFieldErrors(error, setError)
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
        applyApiFieldErrors(error, setError)
        toast.error(getApiErrorMessage(error, "Failed"))
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
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
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <FieldGroup>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <FormTextField
                  control={control}
                  name="supplierCode"
                  label={requiredLabel("Code")}
                  maxLength={30}
                />
                <FormTextField
                  control={control}
                  name="supplierName"
                  label={requiredLabel("Name")}
                  maxLength={120}
                />
                <FormTextField
                  control={control}
                  name="pan"
                  label={requiredLabel("PAN")}
                  maxLength={10}
                />
                <FormTextField
                  control={control}
                  name="gstin"
                  label="GSTIN"
                  maxLength={15}
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
                  comboboxProps={{
                    types: ["COUNTRY", "STATE", "REGION"],
                    status: "ACTIVE",
                  }}
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
                  maxLength={16}
                />
                <FormTextField
                  control={control}
                  name="email"
                  label="Email"
                  type="email"
                  maxLength={254}
                  className="lg:col-span-2"
                />
                <FormTextareaField
                  control={control}
                  name="addressLine"
                  label={requiredLabel("Address")}
                  className="lg:col-span-2"
                />
                <FormTextareaField
                  control={control}
                  name="addressLine2"
                  label="Address Line 2"
                />
                <FormTextareaField
                  control={control}
                  name="addressLine3"
                  label="Address Line 3"
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
