"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  MapPin,
  Building2,
  MapPinned,
  FileCheck2,
  Tags,
  Store,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Stepper, type StepDefinition } from "@/components/ui/stepper"
import { LoadingState } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import {
  FormComboboxField,
  FormDateField,
  FormNumberField,
  FormSelectField,
  FormTextField,
  requiredLabel,
} from "@/components/common/form-fields"
import { getApiError, getApiErrorMessage } from "@/lib/api/api-error"
import { applyApiFieldErrors } from "@/lib/api/form-errors"
import {
  optionalText,
  requiredName,
  requiredText,
} from "@/lib/validations/master-data"
import { optionalGstin, optionalPan } from "@/lib/validations/party"
import { GeographyCombobox } from "@/features/geographies/components/GeographyCombobox"
import { StateCombobox } from "@/components/common/StateCombobox"
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
import {
  apiDateToPicker,
  pickerDateToApi,
  validatePersonalDates,
} from "../lib/personal-dates"
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
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .max(200, "Email must not exceed 200 characters")
      .email("Enter a valid email"),
    addressLine1: requiredText("Address line 1", 200),
    addressLine2: optionalText("Address line 2", 200),
    landmark: optionalText("Landmark", 200),
    city: requiredText("City", 200),
    state: z
      .string()
      .trim()
      .min(1, "State is required")
      .max(200, "State must not exceed 200 characters"),
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
    businessTypeCode: z
      .string()
      .trim()
      .min(1, "Business type is required")
      .max(50, "Business type must not exceed 50 characters"),
    shopSizeCode: z
      .string()
      .trim()
      .min(1, "Shop size is required")
      .max(50, "Shop size must not exceed 50 characters"),
    monthlyPotentialCode: z
      .string()
      .trim()
      .min(1, "Monthly potential is required")
      .max(50, "Monthly potential must not exceed 50 characters"),
    whatsappNumber: customerMobile("WhatsApp number"),
    establishedYear: z
      .string()
      .min(1, "Established year is required")
      .regex(/^\d{4}$/, "Enter a four-digit year"),
    shopTimings: z.object({
      openTime: z
        .string()
        .min(1, "Opening time is required")
        .regex(/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/, "Enter a valid time"),
      closeTime: z
        .string()
        .min(1, "Closing time is required")
        .regex(/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/, "Enter a valid time"),
    }),
    preferredLanguageCode: z.string().optional(),
    source: z.enum(["ADMIN", "EMPLOYEE", "DISTRIBUTOR", "SELF_REGISTRATION"]),
    territoryUuid: z.string().optional(),
    dateOfBirth: z.string().optional(),
    anniversaryDate: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    const add = (path: string, message: string) =>
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: path.split("."),
        message,
      })

    const dateErrors = validatePersonalDates(
      values.dateOfBirth,
      values.anniversaryDate
    )
    for (const field of ["dateOfBirth", "anniversaryDate"] as const) {
      const message = dateErrors[field]
      if (message) add(field, message)
    }
    if (values.gstRegistrationType === "REGISTERED" && !values.gstin?.trim()) {
      add("gstin", "GSTIN is required for registered customers")
    }
    if (
      values.gstRegistrationType === "REGISTERED" &&
      values.pan?.trim() &&
      !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(values.pan.trim())
    ) {
      add("pan", "Enter a valid PAN")
    }
    if (values.gstRegistrationType === "REGISTERED" && !values.pan?.trim()) {
      add("pan", "PAN is required for registered customers")
    }
    if (
      values.shopTimings.openTime &&
      values.shopTimings.closeTime &&
      values.shopTimings.closeTime <= values.shopTimings.openTime
    ) {
      add("shopTimings.closeTime", "Closing time must be after opening time")
    }
    if (values.establishedYear && Number(values.establishedYear) < 1900) {
      add("establishedYear", "Established year must be 1900 or later")
    } else if (
      values.establishedYear &&
      Number(values.establishedYear) > new Date().getFullYear()
    ) {
      add("establishedYear", "Established year cannot be in the future")
    }
    if (values.gstRegistrationType === "UNREGISTERED" && values.gstin?.trim()) {
      add("gstin", "GSTIN must be empty for unregistered customers")
    }
    if ((values.latitude === undefined) !== (values.longitude === undefined)) {
      add("longitude", "Latitude and longitude must be supplied together")
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
    whatsappNumber: "",
    establishedYear: "",
    shopTimings: { openTime: "", closeTime: "" },
    preferredLanguageCode: "",
    source: "ADMIN",
    territoryUuid: "",
    dateOfBirth: "",
    anniversaryDate: "",
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
    whatsappNumber: customer.whatsappNumber ?? "",
    establishedYear:
      customer.establishedYear != null ? String(customer.establishedYear) : "",
    shopTimings: customer.shopTimings ?? { openTime: "", closeTime: "" },
    preferredLanguageCode: customer.preferredLanguageCode ?? "",
    source: customer.source ?? "ADMIN",
    territoryUuid: customer.territoryUuid ?? "",
    dateOfBirth: apiDateToPicker(customer.dateOfBirth),
    anniversaryDate: apiDateToPicker(customer.anniversaryDate),
  }
}

const SOURCE_OPTIONS: { value: CustomerSource; label: string }[] = [
  { value: "ADMIN", label: "Admin (back office)" },
  { value: "EMPLOYEE", label: "Field employee" },
  { value: "DISTRIBUTOR", label: "Distributor" },
  { value: "SELF_REGISTRATION", label: "Self registration" },
]

const CUSTOMER_STEPS: StepDefinition[] = [
  {
    id: "contact",
    title: "Contact",
    description: "Outlet and contact details",
    icon: <Building2 className="size-4" />,
  },
  {
    id: "location",
    title: "Location",
    description: "Address and territory",
    icon: <MapPinned className="size-4" />,
  },
  {
    id: "tax",
    title: "Tax",
    description: "Registration details",
    icon: <FileCheck2 className="size-4" />,
  },
  {
    id: "business",
    title: "Business",
    description: "Shop profile and operating hours",
    icon: <Store className="size-4" />,
  },
  {
    id: "classification",
    title: "Classification",
    description: "Optional business profile",
    optional: true,
    icon: <Tags className="size-4" />,
  },
]

const STEP_FIELDS: (keyof CustomerFormValues)[][] = [
  [
    "customerType",
    "shopName",
    "contactPerson",
    "mobile",
    "alternateMobile",
    "email",
    "dateOfBirth",
    "anniversaryDate",
    "source",
    "whatsappNumber",
  ],
  [
    "pincode",
    "territoryUuid",
    "addressLine1",
    "addressLine2",
    "landmark",
    "city",
    "state",
    "latitude",
    "longitude",
  ],
  ["gstRegistrationType", "gstin", "pan"],
  [
    "businessTypeCode",
    "shopSizeCode",
    "monthlyPotentialCode",
    "establishedYear",
    "shopTimings",
  ],
  [
    "subTypeUuid",
    "channelUuid",
    "segmentUuid",
    "categoryUuid",
    "classUuid",
    "groupUuid",
    "preferredLanguageCode",
  ],
]

const GST_REGISTRATION_OPTIONS: {
  value: GstRegistrationType
  label: string
}[] = [
  { value: "UNREGISTERED", label: "Unregistered" },
  { value: "REGISTERED", label: "GST registered" },
]

type CustomerFormProps = {
  companyUuid: string
  customerUuid?: string | null
}

export function CustomerFormWizard({
  companyUuid,
  customerUuid,
}: CustomerFormProps) {
  const router = useRouter()
  const isEdit = !!customerUuid
  const {
    data: customer,
    isLoading: isDetailLoading,
    error,
    refetch: refetchCustomer,
  } = useCustomer(companyUuid, customerUuid)
  const createMutation = useCreateCustomer(companyUuid)
  const updateMutation = useUpdateCustomer(companyUuid)
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [errorSteps, setErrorSteps] = useState<number[]>([])

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    setFocus,
    trigger,
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: toFormDefaults(),
  })

  const customerTypeUuid = useWatch({ control, name: "customerType" })
  const pincode = useWatch({ control, name: "pincode" })
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
  }, [isEdit, customer, reset])

  useEffect(() => {
    if (lastPincode.current === pincode) return
    // Pincode changed by the user — the previous territory no longer applies.
    lastPincode.current = pincode ?? ""
    manualTerritory.current = false
    setValue("territoryUuid", "", { shouldValidate: false })
  }, [pincode, setValue])

  useEffect(() => {
    if (lastCustomerType.current === (customerTypeUuid ?? "")) return
    // A new customer type invalidates every classification selection.
    lastCustomerType.current = customerTypeUuid ?? ""
    setValue("subTypeUuid", "", { shouldValidate: false })
    setValue("channelUuid", "", { shouldValidate: false })
    setValue("segmentUuid", "", { shouldValidate: false })
    setValue("categoryUuid", "", { shouldValidate: false })
    setValue("classUuid", "", { shouldValidate: false })
  }, [customerTypeUuid, setValue])

  useEffect(() => {
    if (manualTerritory.current) return
    if (resolution.data?.status === "MAPPED" && resolution.data.territoryUuid) {
      setValue("territoryUuid", resolution.data.territoryUuid, {
        shouldValidate: false,
      })
    }
  }, [resolution.data, setValue])

  // Unregistered customers must not carry a stale GSTIN from a previous toggle.
  useEffect(() => {
    if (gstRegistrationType === "UNREGISTERED") {
      setValue("gstin", "", { shouldValidate: false })
    }
  }, [gstRegistrationType, setValue])

  const leaveForm = () => {
    router.push(
      isEdit && customerUuid ? `/customers/${customerUuid}` : "/customers"
    )
  }

  const goToNextStep = async () => {
    const isValid = await trigger(STEP_FIELDS[currentStep])
    if (!isValid) {
      setErrorSteps((steps) =>
        steps.includes(currentStep) ? steps : [...steps, currentStep]
      )
      return
    }
    setErrorSteps((steps) => steps.filter((step) => step !== currentStep))
    setCurrentStep((step) => Math.min(step + 1, CUSTOMER_STEPS.length - 1))
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    })
  }

  const goToFieldStep = (field?: string) => {
    if (!field) return
    const stepIndex = STEP_FIELDS.findIndex((fields) =>
      fields.some((name) => field === name || field.startsWith(`${name}.`))
    )
    if (stepIndex < 0) return
    setErrorSteps((steps) =>
      steps.includes(stepIndex) ? steps : [...steps, stepIndex]
    )
    setCurrentStep(stepIndex)
    window.requestAnimationFrame(() =>
      setFocus(field as keyof CustomerFormValues)
    )
  }

  const handleInvalid = (
    errors: Partial<Record<keyof CustomerFormValues, unknown>>
  ) => {
    const firstField = Object.keys(errors)[0] as
      keyof CustomerFormValues | undefined
    if (!firstField) return
    const stepIndex = STEP_FIELDS.findIndex((fields) =>
      fields.includes(firstField)
    )
    if (stepIndex >= 0) {
      setErrorSteps((steps) =>
        steps.includes(stepIndex) ? steps : [...steps, stepIndex]
      )
      setCurrentStep(stepIndex)
      window.requestAnimationFrame(() => setFocus(firstField))
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

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
      email: values.email.trim(),
      addressLine1: values.addressLine1.trim(),
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
      businessTypeCode: values.businessTypeCode,
      shopSizeCode: values.shopSizeCode,
      monthlyPotentialCode: values.monthlyPotentialCode,
      whatsappNumber: values.whatsappNumber.trim(),
      establishedYear: Number(values.establishedYear),
      shopTimings: values.shopTimings,
      preferredLanguageCode: orUndefined(values.preferredLanguageCode),
      source: values.source,
      territoryUuid: territoryToSend,
      dateOfBirth: pickerDateToApi(values.dateOfBirth),
      anniversaryDate: pickerDateToApi(values.anniversaryDate),
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
      goToFieldStep(apiError?.details?.field ?? apiError?.errors?.[0]?.field)
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
      goToFieldStep(field)
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
            router.push(`/customers/${customerUuid}`)
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
        router.push(`/customers/${created.uuid}`)
      },
      onError,
    })
  }

  const showAutoMapped =
    resolution.data?.status === "MAPPED" &&
    !!resolution.data.territoryUuid &&
    resolution.data.territoryUuid === territoryUuid
  const path = resolution.data?.geographyPath ?? []

  if (isEdit && isDetailLoading)
    return <LoadingState message="Loading customer details..." />
  if (isEdit && (error || !customer))
    return (
      <ErrorState
        message="Could not load this customer."
        onRetry={() => void refetchCustomer()}
      />
    )

  return (
    <div className="flex flex-1 flex-col gap-4">
      <form
        onSubmit={handleSubmit(onSubmit, handleInvalid)}
        className="flex w-full flex-1 flex-col"
        noValidate
      >
        <div className="py-2">
          <Stepper
            steps={CUSTOMER_STEPS}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            errorSteps={errorSteps}
          />
        </div>
        <div className="flex-1 space-y-6 pb-4">
          {errorSteps.includes(currentStep) ? (
            <p role="alert" className="text-sm text-destructive">
              Please fix the highlighted fields before continuing.
            </p>
          ) : null}

          {currentStep === 0 ? (
            <section className="animate-in space-y-6 duration-200 fade-in-50">
              <div className="space-y-1.5 border-b pb-5">
                <h2 className="text-[15px] font-semibold tracking-tight">
                  Contact &amp; shop
                </h2>
                <p className="text-sm text-muted-foreground">
                  Enter the outlet identity and a reliable primary contact.
                </p>
              </div>
              <FieldGroup>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
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
                    name="whatsappNumber"
                    label={requiredLabel("WhatsApp Number")}
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
                    label={requiredLabel("Email")}
                    type="email"
                    maxLength={200}
                  />
                  <FormSelectField
                    control={control}
                    name="source"
                    label="Source"
                    options={SOURCE_OPTIONS}
                  />
                  <FormDateField
                    control={control}
                    name="dateOfBirth"
                    label="Date of birth"
                    disableFuture
                    allowClear
                    clearLabel="Clear date of birth"
                    startMonth={new Date(1900, 0, 1)}
                  />
                  <FormDateField
                    control={control}
                    name="anniversaryDate"
                    label="Anniversary date"
                    disableFuture
                    allowClear
                    clearLabel="Clear anniversary date"
                    startMonth={new Date(1900, 0, 1)}
                  />
                </div>
              </FieldGroup>
            </section>
          ) : null}

          {currentStep === 1 ? (
            <section className="animate-in space-y-6 duration-200 fade-in-50">
              <div className="space-y-1.5 border-b pb-5">
                <h2 className="text-[15px] font-semibold tracking-tight">
                  Location &amp; territory
                </h2>
                <p className="text-sm text-muted-foreground">
                  A pincode can match an existing territory. You can also select
                  one manually.
                </p>
              </div>
              <FieldGroup>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <FormTextField
                    control={control}
                    name="pincode"
                    label={requiredLabel("Pincode")}
                    maxLength={6}
                    placeholder="6-digit pincode"
                  />
                  <div className="sm:col-span-2">
                    <FormComboboxField
                      control={control}
                      name="territoryUuid"
                      label="Territory"
                      companyUuid={companyUuid}
                      Combobox={GeographyCombobox}
                      comboboxProps={{
                        types: ["TERRITORY"],
                        status: "ACTIVE",
                        placeholder: "Select territory...",
                      }}
                    />
                  </div>
                  <div className="sm:col-span-2 xl:col-span-3">
                    <TerritoryHint
                      pincode={pincode}
                      isResolving={resolution.isFetching}
                      status={resolution.data?.status}
                      pathCodes={path.map((item) => item.code)}
                      autoAssigned={showAutoMapped}
                      onUseManual={() => {
                        manualTerritory.current = true
                      }}
                    />
                  </div>
                  <FormTextField
                    control={control}
                    name="addressLine1"
                    label={requiredLabel("Address Line 1")}
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
                    label={requiredLabel("City")}
                    maxLength={200}
                  />
                  <Controller
                    control={control}
                    name="state"
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel>{requiredLabel("State")}</FieldLabel>
                        <StateCombobox
                          id="customer-state"
                          value={field.value}
                          onValueChange={field.onChange}
                          onBlur={field.onBlur}
                          hasError={!!fieldState.error}
                          placeholder="Select state..."
                        />
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
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
              </FieldGroup>
            </section>
          ) : null}

          {currentStep === 2 ? (
            <section className="animate-in space-y-6 duration-200 fade-in-50">
              <div className="space-y-1.5 border-b pb-5">
                <h2 className="text-[15px] font-semibold tracking-tight">
                  Tax &amp; compliance
                </h2>
                <p className="text-sm text-muted-foreground">
                  Select the registration type. GSTIN is required for registered
                  customers.
                </p>
              </div>
              <FieldGroup>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <FormSelectField
                    control={control}
                    name="gstRegistrationType"
                    label="GST Registration"
                    options={GST_REGISTRATION_OPTIONS}
                  />
                  {gstRegistrationType === "REGISTERED" ? (
                    <FormTextField
                      control={control}
                      name="gstin"
                      label={requiredLabel("GSTIN")}
                      maxLength={15}
                    />
                  ) : null}
                  <FormTextField
                    control={control}
                    name="pan"
                    label={requiredLabel(
                      "PAN",
                      gstRegistrationType === "REGISTERED"
                    )}
                    maxLength={10}
                  />
                </div>
              </FieldGroup>
            </section>
          ) : null}

          {currentStep === 3 ? (
            <section className="animate-in space-y-6 duration-200 fade-in-50">
              <div className="space-y-1.5 border-b pb-5">
                <h2 className="text-[15px] font-semibold tracking-tight">
                  Business profile
                </h2>
                <p className="text-sm text-muted-foreground">
                  Required details used for customer classification and
                  servicing.
                </p>
              </div>
              <FieldGroup>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <FormComboboxField
                    control={control}
                    name="businessTypeCode"
                    label={requiredLabel("Business Type")}
                    companyUuid={companyUuid}
                    Combobox={CustomerLookupCombobox}
                    comboboxProps={{ lookupType: "BUSINESS_TYPE" }}
                  />
                  <FormComboboxField
                    control={control}
                    name="shopSizeCode"
                    label={requiredLabel("Shop Size")}
                    companyUuid={companyUuid}
                    Combobox={CustomerLookupCombobox}
                    comboboxProps={{ lookupType: "SHOP_SIZE" }}
                  />
                  <FormComboboxField
                    control={control}
                    name="monthlyPotentialCode"
                    label={requiredLabel("Monthly Potential")}
                    companyUuid={companyUuid}
                    Combobox={CustomerLookupCombobox}
                    comboboxProps={{ lookupType: "MONTHLY_POTENTIAL" }}
                  />
                  <FormTextField
                    control={control}
                    name="establishedYear"
                    label={requiredLabel("Established Year")}
                    type="number"
                    maxLength={4}
                  />
                  <FormTextField
                    control={control}
                    name="shopTimings.openTime"
                    label={requiredLabel("Opening Time")}
                    type="time"
                  />
                  <FormTextField
                    control={control}
                    name="shopTimings.closeTime"
                    label={requiredLabel("Closing Time")}
                    type="time"
                  />
                </div>
              </FieldGroup>
            </section>
          ) : null}

          {currentStep === 4 ? (
            <section className="animate-in space-y-6 duration-200 fade-in-50">
              <div className="space-y-1.5 border-b pb-5">
                <h2 className="text-[15px] font-semibold tracking-tight">
                  Business classification{" "}
                  <span className="font-normal text-muted-foreground">
                    (Optional)
                  </span>
                </h2>
                <p className="text-sm text-muted-foreground">
                  Optional details for segmentation, pricing, and coverage. Only
                  active values are available.
                </p>
              </div>
              <FieldGroup>
                {isClassificationLoading && customerTypeUuid ? (
                  <p className="inline-flex items-center gap-2 pt-2 text-sm text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" />
                    Loading classification options...
                  </p>
                ) : null}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
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
                    name="preferredLanguageCode"
                    label="Preferred Language"
                    companyUuid={companyUuid}
                    Combobox={CustomerLookupCombobox}
                    comboboxProps={{ lookupType: "PREFERRED_LANGUAGE" }}
                  />
                </div>
              </FieldGroup>
            </section>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center justify-between border-t bg-background pt-4 pb-2">
          <div className="flex items-center gap-2">
            {currentStep > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep((step) => step - 1)}
                disabled={isPending}
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={leaveForm}
                disabled={isPending || isCheckingDuplicate}
              >
                Cancel
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:block">
              Step {currentStep + 1} of {CUSTOMER_STEPS.length}
            </span>
            {currentStep > 0 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={leaveForm}
                disabled={isPending || isCheckingDuplicate}
              >
                Cancel
              </Button>
            ) : null}
            {currentStep < CUSTOMER_STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={() => void goToNextStep()}
                disabled={isPending || isCheckingDuplicate}
              >
                {currentStep === 2 ? "Continue to optional details" : "Next"}
                <ArrowRight className="size-4" />
              </Button>
            ) : (
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
            )}
          </div>
        </div>
      </form>
    </div>
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
