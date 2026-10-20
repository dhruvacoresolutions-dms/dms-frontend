"use client"

import { useEffect, useRef, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { AlertCircle, CheckCircle2, Loader2, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field"
import {
  FormComboboxField,
  FormNumberField,
  FormSelectField,
  FormTextField,
  requiredLabel,
} from "@/components/common/form-fields"
import { Spinner } from "@/components/ui/spinner"
import { getApiError, getApiErrorMessage } from "@/lib/api/api-error"
import { applyApiFieldErrors } from "@/lib/api/form-errors"
import { optionalText, requiredName } from "@/lib/validations/master-data"
import {
  optionalEmail,
  optionalGstin,
  optionalPan,
} from "@/lib/validations/party"
import { GeographyCombobox } from "@/features/geographies/components/GeographyCombobox"
import { CustomerTypeCombobox } from "./CustomerTypeCombobox"
import {
  CustomerCategoryCombobox,
  CustomerChannelCombobox,
  CustomerClassCombobox,
  CustomerGroupCombobox,
  CustomerLookupCombobox,
  CustomerSegmentCombobox,
  CustomerSubTypeCombobox,
} from "./CustomerMasterCombobox"
import { useCustomer } from "../hooks/use-customer"
import { useCreateCustomer } from "../hooks/use-create-customer"
import { useUpdateCustomer } from "../hooks/use-update-customer"
import { checkCustomerDuplicate } from "../api/customer.api"
import { useResolvePincode } from "../hooks/use-resolve-pincode"
import { useCustomerClassificationOptions } from "../hooks/use-customer-classification-options"
import {
  customerMobile,
  customerPincode,
  optionalCustomerMobile,
} from "../lib/customer-validation"
import type {
  CustomerRequest,
  CustomerResponse,
  CustomerSource,
  GstRegistrationType,
} from "../api/customer.types"

/**
 * Mirrors `CustomerModels.Request`:
 *  - customerType @NotNull; shopName/contactPerson @SafeName; mobile [6-9][0-9]{9}
 *  - pincode [1-9][0-9]{5}; latitude/longitude must be supplied together
 *  - GSTIN required and format-checked when `gstRegistrationType=REGISTERED`,
 *    forbidden when UNREGISTERED
 *  - selected references must be ACTIVE (comboboxes only list active rows)
 *  - territory is required for every source except SELF_REGISTRATION; the form
 *    auto-resolves it from the pincode mapping when one exists
 */
const customerSchema = z
  .object({
    customerType: z.string().min(1, "Customer type is required"),
    shopName: requiredName("Shop name", 150),
    contactPerson: requiredName("Contact person", 150),
    mobile: customerMobile(),
    alternateMobile: optionalCustomerMobile(),
    email: optionalEmail(200),
    addressLine1: optionalText("Address line 1", 200),
    addressLine2: optionalText("Address line 2", 200),
    landmark: optionalText("Landmark", 200),
    city: optionalText("City", 200),
    state: optionalText("State", 200),
    pincode: customerPincode(),
    latitude: z.coerce
      .number()
      .min(-90, "Latitude must be between -90 and 90")
      .max(90, "Latitude must be between -90 and 90")
      .optional(),
    longitude: z.coerce
      .number()
      .min(-180, "Longitude must be between -180 and 180")
      .max(180, "Longitude must be between -180 and 180")
      .optional(),
    gstRegistrationType: z.enum(["REGISTERED", "UNREGISTERED"]),
    gstin: optionalGstin("GSTIN"),
    pan: optionalPan("PAN"),
    subTypeUuid: z.string().optional(),
    channelUuid: z.string().optional(),
    segmentUuid: z.string().optional(),
    categoryUuid: z.string().optional(),
    classUuid: z.string().optional(),
    groupUuid: z.string().optional(),
    businessTypeCode: z.string().optional(),
    shopSizeCode: z.string().optional(),
    monthlyPotentialCode: z.string().optional(),
    preferredLanguageCode: z.string().optional(),
    source: z.enum(["ADMIN", "EMPLOYEE", "DISTRIBUTOR", "SELF_REGISTRATION"]),
    territoryUuid: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    const add = (path: string, message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message })

    if (values.gstRegistrationType === "REGISTERED" && !values.gstin?.trim()) {
      add("gstin", "GSTIN is required for registered customers")
    }
    if (values.gstRegistrationType === "UNREGISTERED" && values.gstin?.trim()) {
      add("gstin", "GSTIN must be empty for unregistered customers")
    }
    if ((values.latitude === undefined) !== (values.longitude === undefined)) {
      add("longitude", "Latitude and longitude must be supplied together")
    }
    if (
      values.source !== "SELF_REGISTRATION" &&
      !values.territoryUuid?.trim()
    ) {
      add(
        "territoryUuid",
        "Territory is required when the pincode is not mapped"
      )
    }
  })

type CustomerFormValues = z.infer<typeof customerSchema>

function toFormDefaults(): CustomerFormValues {
  return {
    customerType: "",
    shopName: "",
    contactPerson: "",
    mobile: "",
    alternateMobile: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    latitude: undefined,
    longitude: undefined,
    gstRegistrationType: "UNREGISTERED",
    gstin: "",
    pan: "",
    subTypeUuid: "",
    channelUuid: "",
    segmentUuid: "",
    categoryUuid: "",
    classUuid: "",
    groupUuid: "",
    businessTypeCode: "",
    shopSizeCode: "",
    monthlyPotentialCode: "",
    preferredLanguageCode: "",
    source: "ADMIN",
    territoryUuid: "",
  }
}

function toFormValues(customer: CustomerResponse): CustomerFormValues {
  return {
    customerType: customer.customerType ?? "",
    shopName: customer.shopName ?? "",
    contactPerson: customer.contactPerson ?? "",
    mobile: customer.mobile ?? "",
    alternateMobile: customer.alternateMobile ?? "",
    email: customer.email ?? "",
    addressLine1: customer.addressLine1 ?? "",
    addressLine2: customer.addressLine2 ?? "",
    landmark: customer.landmark ?? "",
    city: customer.city ?? "",
    state: customer.state ?? "",
    pincode: customer.pincode ?? "",
    latitude: customer.latitude ?? undefined,
    longitude: customer.longitude ?? undefined,
    gstRegistrationType: customer.gstRegistrationType ?? "UNREGISTERED",
    gstin: customer.gstin ?? "",
    pan: customer.pan ?? "",
    subTypeUuid: customer.subTypeUuid ?? "",
    channelUuid: customer.channelUuid ?? "",
    segmentUuid: customer.segmentUuid ?? "",
    categoryUuid: customer.categoryUuid ?? "",
    classUuid: customer.classUuid ?? "",
    groupUuid: customer.groupUuid ?? "",
    businessTypeCode: customer.businessTypeCode ?? "",
    shopSizeCode: customer.shopSizeCode ?? "",
    monthlyPotentialCode: customer.monthlyPotentialCode ?? "",
    preferredLanguageCode: customer.preferredLanguageCode ?? "",
    source: customer.source ?? "ADMIN",
    territoryUuid: customer.territoryUuid ?? "",
  }
}

const SOURCE_OPTIONS: { value: CustomerSource; label: string }[] = [
  { value: "ADMIN", label: "Admin (back office)" },
  { value: "EMPLOYEE", label: "Field employee" },
  { value: "DISTRIBUTOR", label: "Distributor" },
  { value: "SELF_REGISTRATION", label: "Self registration" },
]

const GST_REGISTRATION_OPTIONS: {
  value: GstRegistrationType
  label: string
}[] = [
  { value: "UNREGISTERED", label: "Unregistered" },
  { value: "REGISTERED", label: "GST registered" },
]

type CustomerFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  /** When set the dialog edits that customer; otherwise it creates one. */
  customerUuid?: string | null
}

export function CustomerFormDialog({
  open,
  onOpenChange,
  companyUuid,
  customerUuid,
}: CustomerFormDialogProps) {
  const isEdit = !!customerUuid
  const {
    data: customer,
    isLoading: isDetailLoading,
    refetch: refetchCustomer,
  } = useCustomer(companyUuid, customerUuid)
  const createMutation = useCreateCustomer(companyUuid)
  const updateMutation = useUpdateCustomer(companyUuid)
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false)

  const { control, handleSubmit, reset, setError, setValue } =
    useForm<CustomerFormValues>({
      resolver: zodResolver(customerSchema),
      defaultValues: toFormDefaults(),
    })

  const customerTypeUuid = useWatch({ control, name: "customerType" })
  const pincode = useWatch({ control, name: "pincode" })
  const source = useWatch({ control, name: "source" })
  const territoryUuid = useWatch({ control, name: "territoryUuid" })
  const gstRegistrationType = useWatch({
    control,
    name: "gstRegistrationType",
  })

  const { data: classification, isLoading: isClassificationLoading } =
    useCustomerClassificationOptions(companyUuid, customerTypeUuid)

  const resolution = useResolvePincode(companyUuid, pincode)

  // Territory is auto-assigned from the pincode mapping unless the user
  // picked one manually or changed the pincode to an unmapped value.
  const manualTerritory = useRef(false)
  const lastPincode = useRef<string>("")
  const hydratedCustomerUuid = useRef<string | null>(null)
  const lastCustomerType = useRef<string>("")

  useEffect(() => {
    if (!open) {
      hydratedCustomerUuid.current = null
      return
    }
    if (isEdit) {
      // Wait for the detail query before hydrating the form.
      if (!customer) return
      if (hydratedCustomerUuid.current === customer.uuid) return
      hydratedCustomerUuid.current = customer.uuid
      reset(toFormValues(customer))
      lastPincode.current = customer.pincode ?? ""
      lastCustomerType.current = customer.customerType ?? ""
    } else {
      reset(toFormDefaults())
      lastPincode.current = ""
      lastCustomerType.current = ""
    }
    // A MANUAL geography row keeps the territory the user picked at creation
    // time — re-resolving from the pincode must not silently replace it.
    manualTerritory.current = isEdit && customer?.geographyStatus === "MANUAL"
  }, [open, isEdit, customer, reset])

  useEffect(() => {
    if (!open) return
    if (lastPincode.current === pincode) return
    // Pincode changed by the user — the previous territory no longer applies.
    lastPincode.current = pincode ?? ""
    manualTerritory.current = false
    setValue("territoryUuid", "", { shouldValidate: false })
  }, [pincode, open, setValue])

  useEffect(() => {
    if (!open) return
    if (lastCustomerType.current === (customerTypeUuid ?? "")) return
    // A new customer type invalidates every classification selection.
    lastCustomerType.current = customerTypeUuid ?? ""
    setValue("subTypeUuid", "", { shouldValidate: false })
    setValue("channelUuid", "", { shouldValidate: false })
    setValue("segmentUuid", "", { shouldValidate: false })
    setValue("categoryUuid", "", { shouldValidate: false })
    setValue("classUuid", "", { shouldValidate: false })
  }, [customerTypeUuid, open, setValue])

  useEffect(() => {
    if (!open || manualTerritory.current) return
    if (resolution.data?.status === "MAPPED" && resolution.data.territoryUuid) {
      setValue("territoryUuid", resolution.data.territoryUuid, {
        shouldValidate: false,
      })
    }
  }, [open, resolution.data, setValue])

  // Unregistered customers must not carry a stale GSTIN from a previous toggle.
  useEffect(() => {
    if (!open) return
    if (gstRegistrationType === "UNREGISTERED") {
      setValue("gstin", "", { shouldValidate: false })
    }
  }, [gstRegistrationType, open, setValue])

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    (isEdit && isDetailLoading)

  const onSubmit = async (values: CustomerFormValues) => {
    const orUndefined = (v?: string) => (v?.trim() ? v.trim() : undefined)

    // The API treats any supplied territory as a MANUAL assignment. When the
    // pincode mapping already resolves to the same territory we omit it so the
    // backend records the row as MAPPED instead of MANUAL.
    const autoResolvedTerritory =
      resolution.data?.status === "MAPPED"
        ? resolution.data.territoryUuid
        : undefined
    const territoryToSend =
      values.territoryUuid && values.territoryUuid !== autoResolvedTerritory
        ? values.territoryUuid
        : undefined

    const payload: CustomerRequest = {
      customerType: values.customerType,
      shopName: values.shopName.trim(),
      contactPerson: values.contactPerson.trim(),
      mobile: values.mobile.trim(),
      alternateMobile: orUndefined(values.alternateMobile),
      email: orUndefined(values.email),
      addressLine1: orUndefined(values.addressLine1),
      addressLine2: orUndefined(values.addressLine2),
      landmark: orUndefined(values.landmark),
      city: orUndefined(values.city),
      state: orUndefined(values.state),
      pincode: values.pincode.trim(),
      latitude: values.latitude,
      longitude: values.longitude,
      gstRegistrationType: values.gstRegistrationType,
      gstin:
        values.gstRegistrationType === "REGISTERED"
          ? values.gstin?.trim().toUpperCase()
          : undefined,
      pan: values.pan?.trim() ? values.pan.trim().toUpperCase() : undefined,
      subTypeUuid: orUndefined(values.subTypeUuid),
      channelUuid: orUndefined(values.channelUuid),
      segmentUuid: orUndefined(values.segmentUuid),
      categoryUuid: orUndefined(values.categoryUuid),
      classUuid: orUndefined(values.classUuid),
      groupUuid: orUndefined(values.groupUuid),
      businessTypeCode: orUndefined(values.businessTypeCode),
      shopSizeCode: orUndefined(values.shopSizeCode),
      monthlyPotentialCode: orUndefined(values.monthlyPotentialCode),
      preferredLanguageCode: orUndefined(values.preferredLanguageCode),
      source: values.source,
      territoryUuid: territoryToSend,
    }

    const onError = (error: unknown) => {
      const apiError = getApiError(error) as
        | (ReturnType<typeof getApiError> & {
            details?: { field?: string | null }
          })
        | undefined
      if (apiError?.code === "DUPLICATE_CUSTOMER") {
        const field = apiError.details?.field
        if (field === "mobile" || field === "gstin") {
          setError(field, { type: "server", message: apiError.message })
        }
      } else {
        applyApiFieldErrors(error, setError)
      }
      // A stale row version (or a customer that left DRAFT/REWORK) is
      // recoverable: pull the latest row so the next submit uses a fresh
      // version. User input is preserved because hydration is keyed by uuid.
      if (
        apiError?.code === "OPTIMISTIC_LOCK_CONFLICT" ||
        apiError?.code === "CUSTOMER_NOT_EDITABLE"
      ) {
        void refetchCustomer()
      }
      toast.error(getApiErrorMessage(error, "Failed to save customer"))
    }

    // Pre-flight the uniqueness rules the API enforces on create/update, so the
    // user sees the clash on the offending field instead of a failed submit.
    setIsCheckingDuplicate(true)
    const probe = await checkCustomerDuplicate(companyUuid, {
      mobile: payload.mobile,
      gstin: payload.gstin,
      excludeUuid: customerUuid ?? undefined,
    }).catch(() => null)
    setIsCheckingDuplicate(false)
    if (probe?.duplicate) {
      const field = probe.field === "gstin" ? "gstin" : "mobile"
      const label = field === "gstin" ? "GSTIN" : "Mobile number"
      const message = probe.customerCode
        ? `${label} is already used by ${probe.customerCode}`
        : `${label} is already used by another customer`
      setError(field, { type: "server", message })
      toast.error(message)
      return
    }

    if (isEdit) {
      if (!customerUuid || !customer) return
      updateMutation.mutate(
        { customerUuid, input: { ...payload, version: customer.version } },
        {
          onSuccess: () => {
            toast.success("Customer updated")
            handleOpenChange(false)
          },
          onError,
        }
      )
      return
    }

    createMutation.mutate(payload, {
      onSuccess: (created) => {
        toast.success(
          created.lifecycleStatus === "ACTIVE"
            ? "Customer created and activated"
            : "Customer created as draft"
        )
        reset(toFormDefaults())
        handleOpenChange(false)
      },
      onError,
    })
  }

  const territoryRequired = source !== "SELF_REGISTRATION"
  const showAutoMapped =
    resolution.data?.status === "MAPPED" &&
    !!resolution.data.territoryUuid &&
    resolution.data.territoryUuid === territoryUuid
  const path = resolution.data?.geographyPath ?? []

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 gap-1 border-b px-5 py-4 pr-12">
          <DialogTitle>
            {isEdit ? "Edit Customer" : "Create Customer"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Customers can only be edited while in DRAFT or REWORK."
              : "Register a retailer, mechanic or other outlet. Customers are created as drafts."}
          </DialogDescription>
        </DialogHeader>
        {isEdit && isDetailLoading ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <Spinner className="size-6" />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col"
            noValidate
          >
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
              <FieldGroup>
                <FieldSet>
                  <FieldLegend>Shop identity</FieldLegend>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <FormComboboxField
                      control={control}
                      name="customerType"
                      label={requiredLabel("Customer Type")}
                      companyUuid={companyUuid}
                      Combobox={CustomerTypeCombobox}
                    />
                    <FormTextField
                      control={control}
                      name="shopName"
                      label={requiredLabel("Shop Name")}
                      maxLength={150}
                    />
                    <FormTextField
                      control={control}
                      name="contactPerson"
                      label={requiredLabel("Contact Person")}
                      maxLength={150}
                    />
                    <FormTextField
                      control={control}
                      name="mobile"
                      label={requiredLabel("Mobile")}
                      maxLength={10}
                      placeholder="10-digit mobile number"
                    />
                    <FormTextField
                      control={control}
                      name="alternateMobile"
                      label="Alternate Mobile"
                      maxLength={10}
                    />
                    <FormTextField
                      control={control}
                      name="email"
                      label="Email"
                      type="email"
                      maxLength={200}
                    />
                    <FormSelectField
                      control={control}
                      name="source"
                      label={requiredLabel("Source")}
                      options={SOURCE_OPTIONS}
                    />
                  </div>
                </FieldSet>
              </FieldGroup>

              <FieldGroup>
                <FieldSet>
                  <FieldLegend>Address &amp; territory</FieldLegend>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <FormTextField
                      control={control}
                      name="pincode"
                      label={requiredLabel("Pincode")}
                      maxLength={6}
                      placeholder="6-digit pincode"
                    />
                    <div className="md:col-span-1 lg:col-span-2">
                      <FormComboboxField
                        control={control}
                        name="territoryUuid"
                        label={requiredLabel("Territory", territoryRequired)}
                        companyUuid={companyUuid}
                        Combobox={GeographyCombobox}
                        comboboxProps={{
                          types: ["TERRITORY"],
                          status: "ACTIVE",
                          placeholder: "Select territory...",
                        }}
                      />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-3">
                      <TerritoryHint
                        pincode={pincode}
                        isResolving={resolution.isFetching}
                        status={resolution.data?.status}
                        pathCodes={path.map((p) => p.code)}
                        autoAssigned={showAutoMapped}
                        onUseManual={() => {
                          manualTerritory.current = true
                        }}
                      />
                    </div>
                    <FormTextField
                      control={control}
                      name="addressLine1"
                      label="Address Line 1"
                      maxLength={200}
                    />
                    <FormTextField
                      control={control}
                      name="addressLine2"
                      label="Address Line 2"
                      maxLength={200}
                    />
                    <FormTextField
                      control={control}
                      name="landmark"
                      label="Landmark"
                      maxLength={200}
                    />
                    <FormTextField
                      control={control}
                      name="city"
                      label="City"
                      maxLength={200}
                    />
                    <FormTextField
                      control={control}
                      name="state"
                      label="State"
                      maxLength={200}
                    />
                    <FormNumberField
                      control={control}
                      name="latitude"
                      label="Latitude"
                    />
                    <FormNumberField
                      control={control}
                      name="longitude"
                      label="Longitude"
                    />
                  </div>
                </FieldSet>
              </FieldGroup>

              <FieldGroup>
                <FieldSet>
                  <FieldLegend>Tax</FieldLegend>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <FormSelectField
                      control={control}
                      name="gstRegistrationType"
                      label={requiredLabel("GST Registration")}
                      options={GST_REGISTRATION_OPTIONS}
                    />
                    {gstRegistrationType === "REGISTERED" && (
                      <FormTextField
                        control={control}
                        name="gstin"
                        label={requiredLabel("GSTIN")}
                        maxLength={15}
                      />
                    )}
                    <FormTextField
                      control={control}
                      name="pan"
                      label="PAN"
                      maxLength={10}
                    />
                  </div>
                </FieldSet>
              </FieldGroup>

              <FieldGroup>
                <FieldSet>
                  <FieldLegend>Classification</FieldLegend>
                  <p className="-mt-1 text-sm text-muted-foreground">
                    Classify the outlet to drive segmentation, pricing and
                    coverage rules. Only active values are offered.
                  </p>
                  {isClassificationLoading && customerTypeUuid ? (
                    <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin" />
                      Loading classification options...
                    </p>
                  ) : null}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <FormComboboxField
                      control={control}
                      name="subTypeUuid"
                      label="Sub Type"
                      companyUuid={companyUuid}
                      Combobox={CustomerSubTypeCombobox}
                      comboboxProps={{
                        customerTypeUuid: customerTypeUuid || null,
                        optionsOverride: classification?.subTypes,
                      }}
                    />
                    <FormComboboxField
                      control={control}
                      name="channelUuid"
                      label="Channel"
                      companyUuid={companyUuid}
                      Combobox={CustomerChannelCombobox}
                      comboboxProps={{
                        optionsOverride: classification?.channels,
                      }}
                    />
                    <FormComboboxField
                      control={control}
                      name="segmentUuid"
                      label="Segment"
                      companyUuid={companyUuid}
                      Combobox={CustomerSegmentCombobox}
                      comboboxProps={{
                        optionsOverride: classification?.segments,
                      }}
                    />
                    <FormComboboxField
                      control={control}
                      name="categoryUuid"
                      label="Category"
                      companyUuid={companyUuid}
                      Combobox={CustomerCategoryCombobox}
                      comboboxProps={{
                        optionsOverride: classification?.categories,
                      }}
                    />
                    <FormComboboxField
                      control={control}
                      name="classUuid"
                      label="Class"
                      companyUuid={companyUuid}
                      Combobox={CustomerClassCombobox}
                      comboboxProps={{
                        optionsOverride: classification?.classes,
                      }}
                    />
                    <FormComboboxField
                      control={control}
                      name="groupUuid"
                      label="Group"
                      companyUuid={companyUuid}
                      Combobox={CustomerGroupCombobox}
                    />
                    <FormComboboxField
                      control={control}
                      name="businessTypeCode"
                      label="Business Type"
                      companyUuid={companyUuid}
                      Combobox={CustomerLookupCombobox}
                      comboboxProps={{ lookupType: "BUSINESS_TYPE" }}
                    />
                    <FormComboboxField
                      control={control}
                      name="shopSizeCode"
                      label="Shop Size"
                      companyUuid={companyUuid}
                      Combobox={CustomerLookupCombobox}
                      comboboxProps={{ lookupType: "SHOP_SIZE" }}
                    />
                    <FormComboboxField
                      control={control}
                      name="monthlyPotentialCode"
                      label="Monthly Potential"
                      companyUuid={companyUuid}
                      Combobox={CustomerLookupCombobox}
                      comboboxProps={{ lookupType: "MONTHLY_POTENTIAL" }}
                    />
                    <FormComboboxField
                      control={control}
                      name="preferredLanguageCode"
                      label="Preferred Language"
                      companyUuid={companyUuid}
                      Combobox={CustomerLookupCombobox}
                      comboboxProps={{ lookupType: "PREFERRED_LANGUAGE" }}
                    />
                  </div>
                </FieldSet>
              </FieldGroup>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t bg-muted/40 px-5 py-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending || isCheckingDuplicate}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || isCheckingDuplicate}>
                {isCheckingDuplicate
                  ? "Checking duplicates..."
                  : isPending
                    ? isEdit
                      ? "Saving..."
                      : "Creating..."
                    : isEdit
                      ? "Save changes"
                      : "Create customer"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function TerritoryHint({
  pincode,
  isResolving,
  status,
  pathCodes,
  autoAssigned,
  onUseManual,
}: {
  pincode?: string
  isResolving: boolean
  status?: "MAPPED" | "NOT_CONFIGURED" | "MAPPING_PENDING" | "REVIEW"
  pathCodes: string[]
  autoAssigned: boolean
  onUseManual: () => void
}) {
  if (!pincode || !/^[1-9][0-9]{5}$/.test(pincode)) {
    return (
      <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="size-3.5" aria-hidden="true" />
        Enter a 6-digit pincode to auto-resolve the territory.
      </p>
    )
  }

  if (isResolving) {
    return (
      <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        Resolving territory for {pincode}...
      </p>
    )
  }

  if (status === "MAPPED" && autoAssigned) {
    return (
      <p className="inline-flex flex-wrap items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="size-3.5" aria-hidden="true" />
        Auto-mapped from pincode
        {pathCodes.length ? ` · ${[...pathCodes].reverse().join(" / ")}` : ""}
      </p>
    )
  }

  if (status && status !== "MAPPED") {
    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-amber-700 dark:text-amber-400">
        <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
        <span>
          {status === "NOT_CONFIGURED"
            ? "This pincode has no territory mapping."
            : `Pincode mapping is ${status.toLowerCase().replace("_", " ")}.`}{" "}
          Select a territory manually
          {status === "NOT_CONFIGURED"
            ? " or add a mapping under Customers → Pincode Mappings."
            : "."}
        </span>
        <button
          type="button"
          onClick={onUseManual}
          className="cursor-pointer font-medium underline underline-offset-4"
        >
          Keep manual selection
        </button>
      </div>
    )
  }

  return (
    <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <MapPin className="size-3.5" aria-hidden="true" />
      Territory can be auto-mapped from the pincode or selected manually.
    </p>
  )
}
