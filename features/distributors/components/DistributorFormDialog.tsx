"use client"

import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
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
  FormNumberField,
  FormSelectField,
  FormSwitchField,
  FormTextareaField,
  FormTextField,
  requiredLabel,
} from "@/components/common/form-fields"
import { Spinner } from "@/components/ui/spinner"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { applyApiFieldErrors } from "@/lib/api/form-errors"
import {
  optionalText,
  requiredCode,
  requiredName,
  requiredText,
} from "@/lib/validations/master-data"
import {
  optionalEmail,
  optionalGstin,
  optionalPan,
  PHONE_PATTERN,
} from "@/lib/validations/party"
import { GeographyCombobox } from "@/features/geographies/components/GeographyCombobox"
import { SupplierCombobox } from "@/features/suppliers/components/SupplierCombobox"
import {
  BusinessConstitutionCombobox,
  DistributorTypeCombobox,
  PaymentTermCombobox,
  TaxProfileCombobox,
} from "./DistributorReferenceCombobox"
import { DistributorCombobox } from "./DistributorCombobox"
import { useDistributor } from "../hooks/use-distributor"
import { useCreateDistributor } from "../hooks/use-create-distributor"
import { useUpdateDistributor } from "../hooks/use-update-distributor"
import { useDistributorReference } from "../hooks/use-distributor-reference"

/**
 * Mirrors `CreateDistributorRequest` / `UpdateDistributorRequest`:
 *  - distributorCode @NotBlank @Size(max=30) @SafeCode
 *  - distributorName @NotBlank @Size(max=120) @SafeName
 *  - legalName @NotBlank @Size(max=200) @SafeName
 *  - distributorTypeUuid @NotNull (active), parentDistributorUuid required
 *    when the selected type has `requiresParent`
 *  - primaryContactName @NotBlank @Size(max=120) @SafeName
 *  - mobileNumber @NotBlank @Pattern(^\+?[0-9]{7,15}$), email @Email @Size(max=254)
 *  - addressLine1 @NotBlank @Size(max=200), postalCode @NotBlank @Size(max=20)
 *  - geographyUuid @NotNull (must resolve to an active REGION)
 *  - taxRegistrationStatus @NotNull, taxProfileUuid @NotNull (active)
 *  - pan/gstin format rules, GSTIN required when REGISTERED and absent when
 *    UNREGISTERED, GSTIN must embed the PAN
 *  - creditLimit @Digits(12,2) ≥ 0 and creditDays 0..365, both required only
 *    when creditAllowed (`DistributorService.rules`).
 */
const baseDistributorSchema = z.object({
  distributorCode: requiredCode("Code", 30),
  distributorName: requiredName("Name", 120),
  legalName: requiredName("Legal name", 200),
  distributorTypeUuid: z.string().min(1, "Distributor type is required"),
  parentDistributorUuid: z.string().optional(),
  businessConstitutionUuid: z.string().optional(),
  effectiveFrom: z.string().optional(),
  primaryContactName: requiredName("Primary contact", 120),
  mobileNumber: z
    .string()
    .trim()
    .min(1, "Mobile number is required")
    .refine((v) => PHONE_PATTERN.test(v), "Enter a valid mobile number"),
  email: optionalEmail(254),
  addressLine1: requiredText("Address", 200),
  addressLine2: optionalText("Address line 2", 500),
  postalCode: requiredText("Postal code", 20),
  geographyUuid: z.string().min(1, "Geography is required"),
  taxRegistrationStatus: z.enum(["REGISTERED", "UNREGISTERED"]),
  pan: optionalPan("PAN"),
  gstin: optionalGstin("GSTIN"),
  taxProfileUuid: z.string().min(1, "Tax profile is required"),
  paymentTermsUuid: z.string().optional(),
  creditAllowed: z.boolean(),
  creditLimit: z.coerce
    .number()
    .nonnegative("Credit limit cannot be negative")
    .max(999_999_999_999.99, "Credit limit is too large")
    .refine(
      (v) => /^\d+(\.\d{1,2})?$/.test(String(v)),
      "Credit limit allows at most 2 decimals"
    )
    .optional(),
  creditDays: z.coerce
    .number()
    .int("Credit days must be a whole number")
    .min(0, "Credit days cannot be negative")
    .max(365, "Credit days must not exceed 365")
    .optional(),
  supplierUuid: z.string().optional(),
  sfaEnabled: z.boolean(),
  orderBookingEnabled: z.boolean(),
  collectionEnabled: z.boolean(),
})

type DistributorFormValues = z.infer<typeof baseDistributorSchema>

const distributorSchema = baseDistributorSchema.superRefine((values, ctx) => {
  const add = (path: string, message: string) =>
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message })

  const gstin = values.gstin?.trim() ?? ""
  const pan = values.pan?.trim() ?? ""
  if (values.taxRegistrationStatus === "REGISTERED" && !gstin) {
    add("gstin", "GSTIN is required when registered")
  }
  if (values.taxRegistrationStatus === "UNREGISTERED" && gstin) {
    add("gstin", "GSTIN must be absent when unregistered")
  }
  if (
    pan &&
    gstin.length >= 12 &&
    pan.toUpperCase() !== gstin.slice(2, 12).toUpperCase()
  ) {
    add("gstin", "GSTIN must contain the supplied PAN")
  }

  if (values.creditAllowed) {
    if (values.creditLimit === undefined) {
      add("creditLimit", "Credit limit is required when credit is allowed")
    }
    if (values.creditDays === undefined) {
      add("creditDays", "Credit days are required when credit is allowed")
    }
  }
})

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
    parentDistributorUuid: "",
    businessConstitutionUuid: "",
    effectiveFrom: "",
    primaryContactName: "",
    mobileNumber: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    postalCode: "",
    geographyUuid: "",
    taxRegistrationStatus: "REGISTERED",
    pan: "",
    gstin: "",
    taxProfileUuid: "",
    paymentTermsUuid: "",
    creditAllowed: false,
    creditLimit: undefined,
    creditDays: undefined,
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

  const { handleSubmit, control, reset, setError } =
    useForm<DistributorFormValues>({
      resolver: zodResolver(distributorSchema),
      defaultValues: toFormDefaults(),
    })

  const distributorTypeUuid = useWatch({
    control,
    name: "distributorTypeUuid",
  })
  const taxRegistrationStatus = useWatch({
    control,
    name: "taxRegistrationStatus",
  })
  const creditAllowed = useWatch({ control, name: "creditAllowed" })

  // A type flagged `requiresParent` makes the parent distributor mandatory. The
  // flag lives on the selected reference master; the parent check is enforced
  // in `onSubmit` because the field is only rendered when it applies.
  const { data: distributorType } = useDistributorReference(
    companyUuid,
    "distributor-types",
    distributorTypeUuid ?? ""
  )
  const requiresParent = distributorType?.requiresParent === true

  useEffect(() => {
    if (!open) return
    if (isEdit) {
      if (distributor) {
        reset({
          distributorCode: distributor.distributorCode,
          distributorName: distributor.distributorName,
          legalName: distributor.legalName ?? "",
          distributorTypeUuid: distributor.distributorTypeUuid ?? "",
          parentDistributorUuid: distributor.parentDistributorUuid ?? "",
          businessConstitutionUuid: distributor.businessConstitutionUuid ?? "",
          effectiveFrom: distributor.effectiveFrom ?? "",
          primaryContactName: distributor.primaryContactName ?? "",
          mobileNumber: distributor.mobileNumber ?? "",
          email: distributor.email ?? "",
          addressLine1: distributor.addressLine1 ?? "",
          addressLine2: distributor.addressLine2 ?? "",
          postalCode: distributor.postalCode ?? "",
          geographyUuid: distributor.geographyUuid ?? "",
          taxRegistrationStatus:
            distributor.taxRegistrationStatus ?? "REGISTERED",
          pan: distributor.pan ?? "",
          gstin: distributor.gstin ?? "",
          taxProfileUuid: distributor.taxProfileUuid ?? "",
          paymentTermsUuid: distributor.paymentTermsUuid ?? "",
          creditAllowed: distributor.creditAllowed ?? false,
          creditLimit: distributor.creditLimit ?? undefined,
          creditDays: distributor.creditDays ?? undefined,
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
    if (requiresParent && !values.parentDistributorUuid) {
      setError("parentDistributorUuid", {
        type: "manual",
        message: "Parent distributor is required for this type",
      })
      toast.error("Please fix the errors before submitting")
      return
    }

    const orUndefined = (v?: string) => (v?.trim() ? v.trim() : undefined)
    const payload = {
      distributorCode: values.distributorCode.trim().toUpperCase(),
      distributorName: values.distributorName.trim(),
      legalName: values.legalName.trim(),
      distributorTypeUuid: values.distributorTypeUuid,
      parentDistributorUuid: values.parentDistributorUuid || undefined,
      businessConstitutionUuid: values.businessConstitutionUuid || undefined,
      effectiveFrom: values.effectiveFrom || undefined,
      primaryContactName: values.primaryContactName.trim(),
      mobileNumber: values.mobileNumber.trim(),
      email: orUndefined(values.email),
      addressLine1: values.addressLine1.trim(),
      addressLine2: orUndefined(values.addressLine2),
      postalCode: values.postalCode.trim(),
      geographyUuid: values.geographyUuid,
      geographyType: "REGION",
      taxRegistrationStatus: values.taxRegistrationStatus,
      pan: values.pan?.trim() ? values.pan.trim().toUpperCase() : undefined,
      gstin: values.gstin?.trim()
        ? values.gstin.trim().toUpperCase()
        : undefined,
      taxProfileUuid: values.taxProfileUuid,
      paymentTermsUuid: values.paymentTermsUuid || undefined,
      creditAllowed: values.creditAllowed,
      // Credit values are only meaningful when credit is allowed; the backend
      // rejects a limit/days while credit is disabled.
      creditLimit: values.creditAllowed ? values.creditLimit : undefined,
      creditDays: values.creditAllowed ? values.creditDays : undefined,
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
        toast.success("Distributor created")
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
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            <FieldGroup>
              <FieldSet>
                <FieldLegend>Identity</FieldLegend>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <FormTextField
                    control={control}
                    name="distributorCode"
                    label={requiredLabel("Code")}
                    maxLength={30}
                  />
                  <FormTextField
                    control={control}
                    name="distributorName"
                    label={requiredLabel("Name")}
                    maxLength={120}
                  />
                  <FormTextField
                    control={control}
                    name="legalName"
                    label={requiredLabel("Legal Name")}
                    maxLength={200}
                  />
                  <FormComboboxField
                    control={control}
                    name="distributorTypeUuid"
                    label={requiredLabel("Distributor Type")}
                    companyUuid={companyUuid}
                    Combobox={DistributorTypeCombobox}
                  />
                  {requiresParent && (
                    <FormComboboxField
                      control={control}
                      name="parentDistributorUuid"
                      label={requiredLabel("Parent Distributor")}
                      companyUuid={companyUuid}
                      Combobox={DistributorCombobox}
                      comboboxProps={{
                        excludeIds: distributorUuid ? [distributorUuid] : [],
                      }}
                    />
                  )}
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
                    label={requiredLabel("Primary Contact")}
                    maxLength={120}
                  />
                  <FormTextField
                    control={control}
                    name="mobileNumber"
                    label={requiredLabel("Mobile Number")}
                    placeholder="Enter mobile number"
                    maxLength={16}
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
                    label={requiredLabel("Postal Code")}
                    maxLength={20}
                  />
                  <FormComboboxField
                    control={control}
                    name="geographyUuid"
                    label={requiredLabel("Geography")}
                    companyUuid={companyUuid}
                    Combobox={GeographyCombobox}
                    comboboxProps={{
                      types: ["REGION"],
                      status: "ACTIVE",
                    }}
                  />
                  <FormTextareaField
                    control={control}
                    name="addressLine1"
                    label={requiredLabel("Address")}
                    className="lg:col-span-2"
                  />
                  <FormTextareaField
                    control={control}
                    name="addressLine2"
                    label="Address Line 2"
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
                    label={requiredLabel("Tax Registration Status")}
                    options={[
                      { value: "REGISTERED", label: "Registered" },
                      { value: "UNREGISTERED", label: "Unregistered" },
                    ]}
                  />
                  <FormTextField
                    control={control}
                    name="pan"
                    label="PAN"
                    maxLength={10}
                  />
                  <FormTextField
                    control={control}
                    name="gstin"
                    label={requiredLabel(
                      "GSTIN",
                      taxRegistrationStatus === "REGISTERED"
                    )}
                    maxLength={15}
                  />
                  <FormComboboxField
                    control={control}
                    name="taxProfileUuid"
                    label={requiredLabel("Tax Profile")}
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
                  {creditAllowed && (
                    <>
                      <FormNumberField
                        control={control}
                        name="creditLimit"
                        label={requiredLabel("Credit Limit")}
                        min={0}
                      />
                      <FormNumberField
                        control={control}
                        name="creditDays"
                        label={requiredLabel("Credit Days")}
                        step="1"
                        min={0}
                      />
                    </>
                  )}
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
