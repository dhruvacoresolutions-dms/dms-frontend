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
import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field"
import {
  FormComboboxField,
  FormDateField,
  FormSelectField,
  FormSwitchField,
  FormTextareaField,
  FormTextField,
} from "@/components/common/form-fields"
import { Spinner } from "@/components/ui/spinner"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { GeographyCombobox } from "@/features/geographies/components/GeographyCombobox"
import { SupplierCombobox } from "@/features/suppliers/components/SupplierCombobox"
import {
  BusinessConstitutionCombobox,
  DistributorTypeCombobox,
  PaymentTermCombobox,
  TaxProfileCombobox,
} from "./DistributorReferenceCombobox"
import { useDistributor } from "../hooks/use-distributor"
import { useCreateDistributor } from "../hooks/use-create-distributor"
import { useUpdateDistributor } from "../hooks/use-update-distributor"

const phonePattern = /^$|^\+?[0-9]{7,15}$/

const distributorSchema = z.object({
  distributorCode: z.string().min(1, "Code is required").max(40),
  distributorName: z.string().min(1, "Name is required").max(200),
  legalName: z.string().max(200).optional(),
  distributorTypeUuid: z.string().optional(),
  businessConstitutionUuid: z.string().optional(),
  effectiveFrom: z.string().optional(),
  primaryContactName: z.string().max(150).optional(),
  mobileNumber: z
    .string()
    .regex(phonePattern, "Enter a valid mobile number")
    .optional(),
  email: z
    .string()
    .max(254)
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: "Enter a valid email",
    })
    .optional(),
  addressLine1: z.string().max(500).optional(),
  postalCode: z.string().max(20).optional(),
  geographyUuid: z.string().optional(),
  taxRegistrationStatus: z.enum(["REGISTERED", "UNREGISTERED"]).optional(),
  taxProfileUuid: z.string().optional(),
  paymentTermsUuid: z.string().optional(),
  creditAllowed: z.boolean(),
  supplierUuid: z.string().optional(),
  sfaEnabled: z.boolean(),
  orderBookingEnabled: z.boolean(),
  collectionEnabled: z.boolean(),
})

type DistributorFormValues = z.infer<typeof distributorSchema>

type DistributorFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  /** When set, the dialog edits that distributor; otherwise it creates one */
  distributorUuid?: string | null
}

function toFormDefaults(): DistributorFormValues {
  return {
    distributorCode: "",
    distributorName: "",
    legalName: "",
    distributorTypeUuid: "",
    businessConstitutionUuid: "",
    effectiveFrom: "",
    primaryContactName: "",
    mobileNumber: "",
    email: "",
    addressLine1: "",
    postalCode: "",
    geographyUuid: "",
    taxRegistrationStatus: "REGISTERED",
    taxProfileUuid: "",
    paymentTermsUuid: "",
    creditAllowed: false,
    supplierUuid: "",
    sfaEnabled: true,
    orderBookingEnabled: true,
    collectionEnabled: true,
  }
}

export function DistributorFormDialog({
  open,
  onOpenChange,
  companyUuid,
  distributorUuid,
}: DistributorFormDialogProps) {
  const isEdit = !!distributorUuid
  const { data: distributor, isLoading: isDetailLoading } = useDistributor(
    companyUuid,
    distributorUuid ?? ""
  )
  const createMutation = useCreateDistributor(companyUuid)
  const updateMutation = useUpdateDistributor(companyUuid)

  const { handleSubmit, control, reset } = useForm<DistributorFormValues>({
    resolver: zodResolver(distributorSchema),
    defaultValues: toFormDefaults(),
  })

  useEffect(() => {
    if (!open) return
    if (isEdit) {
      if (distributor) {
        reset({
          distributorCode: distributor.distributorCode,
          distributorName: distributor.distributorName,
          legalName: distributor.legalName ?? "",
          distributorTypeUuid: distributor.distributorTypeUuid ?? "",
          businessConstitutionUuid:
            distributor.businessConstitutionUuid ?? "",
          effectiveFrom: distributor.effectiveFrom ?? "",
          primaryContactName: distributor.primaryContactName ?? "",
          mobileNumber: distributor.mobileNumber ?? "",
          email: distributor.email ?? "",
          addressLine1: distributor.addressLine1 ?? "",
          postalCode: distributor.postalCode ?? "",
          geographyUuid: distributor.geographyUuid ?? "",
          taxRegistrationStatus:
            distributor.taxRegistrationStatus ?? "REGISTERED",
          taxProfileUuid: distributor.taxProfileUuid ?? "",
          paymentTermsUuid: distributor.paymentTermsUuid ?? "",
          creditAllowed: distributor.creditAllowed ?? false,
          supplierUuid: distributor.supplierUuid ?? "",
          sfaEnabled: distributor.sfaEnabled ?? false,
          orderBookingEnabled: distributor.orderBookingEnabled ?? false,
          collectionEnabled: distributor.collectionEnabled ?? false,
        })
      }
    } else {
      reset(toFormDefaults())
    }
  }, [open, isEdit, distributor, reset])

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    (isEdit && isDetailLoading)

  const onSubmit = (values: DistributorFormValues) => {
    const payload = {
      distributorCode: values.distributorCode.trim(),
      distributorName: values.distributorName.trim(),
      legalName: values.legalName?.trim() || undefined,
      distributorTypeUuid: values.distributorTypeUuid || undefined,
      businessConstitutionUuid: values.businessConstitutionUuid || undefined,
      effectiveFrom: values.effectiveFrom || undefined,
      primaryContactName: values.primaryContactName?.trim() || undefined,
      mobileNumber: values.mobileNumber?.trim() || undefined,
      email: values.email?.trim() || undefined,
      addressLine1: values.addressLine1?.trim() || undefined,
      postalCode: values.postalCode?.trim() || undefined,
      geographyUuid: values.geographyUuid || undefined,
      geographyType: values.geographyUuid ? "REGION" : undefined,
      taxRegistrationStatus: values.taxRegistrationStatus,
      taxProfileUuid: values.taxProfileUuid || undefined,
      paymentTermsUuid: values.paymentTermsUuid || undefined,
      creditAllowed: values.creditAllowed,
      supplierUuid: values.supplierUuid || undefined,
      sfaEnabled: values.sfaEnabled,
      orderBookingEnabled: values.orderBookingEnabled,
      collectionEnabled: values.collectionEnabled,
    }

    if (isEdit) {
      if (!distributorUuid) return
      updateMutation.mutate(
        {
          distributorUuid,
          input: { ...payload, version: distributor?.version },
        },
        {
          onSuccess: () => {
            toast.success("Distributor updated")
            handleOpenChange(false)
          },
          onError: (error) => toast.error(getApiErrorMessage(error, "Failed")),
        }
      )
      return
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Distributor created")
        reset(toFormDefaults())
        handleOpenChange(false)
      },
      onError: (error) => toast.error(getApiErrorMessage(error, "Failed")),
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Distributor" : "Create Distributor"}
          </DialogTitle>
        </DialogHeader>
        {isEdit && isDetailLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FieldGroup>
              <FieldSet>
                <FieldLegend>Identity</FieldLegend>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <FormTextField
                    control={control}
                    name="distributorCode"
                    label="Code *"
                    maxLength={40}
                  />
                  <FormTextField
                    control={control}
                    name="distributorName"
                    label="Name *"
                    maxLength={200}
                  />
                  <FormTextField
                    control={control}
                    name="legalName"
                    label="Legal Name"
                    maxLength={200}
                  />
                  <FormComboboxField
                    control={control}
                    name="distributorTypeUuid"
                    label="Distributor Type"
                    companyUuid={companyUuid}
                    Combobox={DistributorTypeCombobox}
                  />
                  <FormComboboxField
                    control={control}
                    name="businessConstitutionUuid"
                    label="Business Constitution"
                    companyUuid={companyUuid}
                    Combobox={BusinessConstitutionCombobox}
                  />
                  <FormDateField
                    control={control}
                    name="effectiveFrom"
                    label="Effective From"
                  />
                </div>
              </FieldSet>
            </FieldGroup>

            <FieldGroup>
              <FieldSet>
                <FieldLegend>Contact &amp; Address</FieldLegend>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <FormTextField
                    control={control}
                    name="primaryContactName"
                    label="Primary Contact"
                    maxLength={150}
                  />
                  <FormTextField
                    control={control}
                    name="mobileNumber"
                    label="Mobile Number"
                    placeholder="Enter mobile number"
                  />
                  <FormTextField
                    control={control}
                    name="email"
                    label="Email"
                    type="email"
                    maxLength={254}
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
                  <FormTextareaField
                    control={control}
                    name="addressLine1"
                    label="Address"
                    className="lg:col-span-2"
                  />
                </div>
              </FieldSet>
            </FieldGroup>

            <FieldGroup>
              <FieldSet>
                <FieldLegend>Tax &amp; Commercial</FieldLegend>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <FormSelectField
                    control={control}
                    name="taxRegistrationStatus"
                    label="Tax Registration Status"
                    options={[
                      { value: "REGISTERED", label: "Registered" },
                      { value: "UNREGISTERED", label: "Unregistered" },
                    ]}
                  />
                  <FormComboboxField
                    control={control}
                    name="taxProfileUuid"
                    label="Tax Profile"
                    companyUuid={companyUuid}
                    Combobox={TaxProfileCombobox}
                  />
                  <FormComboboxField
                    control={control}
                    name="paymentTermsUuid"
                    label="Payment Terms"
                    companyUuid={companyUuid}
                    Combobox={PaymentTermCombobox}
                  />
                  <FormComboboxField
                    control={control}
                    name="supplierUuid"
                    label="Linked Supplier"
                    companyUuid={companyUuid}
                    Combobox={SupplierCombobox}
                  />
                  <FormSwitchField
                    control={control}
                    name="creditAllowed"
                    label="Credit Allowed"
                  />
                </div>
              </FieldSet>
            </FieldGroup>

            <FieldGroup>
              <FieldSet>
                <FieldLegend>Operating Modes</FieldLegend>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <FormSwitchField
                    control={control}
                    name="sfaEnabled"
                    label="SFA Enabled"
                  />
                  <FormSwitchField
                    control={control}
                    name="orderBookingEnabled"
                    label="Order Booking Enabled"
                  />
                  <FormSwitchField
                    control={control}
                    name="collectionEnabled"
                    label="Collection Enabled"
                  />
                </div>
              </FieldSet>
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
