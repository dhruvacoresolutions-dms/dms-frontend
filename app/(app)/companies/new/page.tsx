"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Check,
  Copy,
  CheckCircle2,
  Building2,
  MapPin,
  Settings2,
  ArrowLeft,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PageHeader } from "@/components/common/PageHeader"
import { Stepper } from "@/components/ui/stepper"
import { StateCombobox } from "@/components/common/StateCombobox"
import { PhoneInput } from "@/components/common/PhoneInput"
import { useCreateCompany } from "@/features/companies/hooks/use-create-company"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { extractPanFromGstin, ensurePlus91 } from "@/lib/utils"
import type { CreateCompanyResponse } from "@/features/companies/api/company.types"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FEATURES = [
  { value: "DMS_CORE", label: "DMS Core", description: "Core document management capabilities" },
  { value: "GEOGRAPHY_MANAGEMENT", label: "Geography Management", description: "Geography administration capabilities" },
] as const

const STEPS = [
  {
    id: "company-info",
    title: "Company Information",
    description: "Basic business details",
    icon: <Building2 className="size-4" />,
  },
  {
    id: "company-address",
    title: "Company Address",
    description: "Primary registered address",
    icon: <MapPin className="size-4" />,
  },
  {
    id: "rest-info",
    title: "Rest Information",
    description: "Contact & configuration",
    icon: <Settings2 className="size-4" />,
  },
] as const

// ---------------------------------------------------------------------------
// Validation — flattened form schema, transformed to API payload on submit
// ---------------------------------------------------------------------------

const companySchema = z.object({
  // Step 1 - Company Information
  companyCode: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(40, "Code must not exceed 40 characters")
    .regex(/^[A-Za-z0-9_-]+$/, "Code must contain only letters, numbers, hyphens, or underscores"),
  companyName: z.string().min(1, "Company name is required").max(120, "Company name is too long"),
  legalName: z.string().max(200, "Legal name is too long").optional().or(z.literal("")),
  companyType: z.enum(["MANUFACTURER", "DISTRIBUTOR", "DEALER", "RETAILER", "SERVICE_PROVIDER", "OTHER"], {
    required_error: "Company type is required",
  }),
  businessDomain: z.enum(["FMCG", "AUTOMOTIVE"], {
    required_error: "Business domain is required",
  }),
  gstin: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v), {
      message: "Invalid GSTIN (e.g. 23ABCDE1234F1Z5)",
    }),
  pan: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v), {
      message: "Invalid PAN (e.g. ABCDE1234F)",
    }),
  cin: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^[A-Z0-9]{21}$/.test(v), {
      message: "Invalid CIN (21 alphanumeric characters)",
    }),

  // Step 2 - Primary Address
  addressType: z.string().min(1, "Address type is required"),
  line1: z.string().min(1, "Address line 1 is required"),
  line2: z.string().optional().or(z.literal("")),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  district: z.string().optional().or(z.literal("")),
  postalCode: z
    .string()
    .min(1, "Postal code is required")
    .regex(/^\d{5,6}$/, "Postal code must be 5-6 digits"),
  countryCode: z.string().length(2, "Country code must be exactly 2 characters"),

  // Step 3 - Rest Information
  contactName: z.string().min(1, "Contact name is required"),
  contactMobile: z
    .string()
    .min(1, "Mobile is required")
    .regex(/^[6-9]\d{9}$/, "Enter valid 10-digit Indian mobile (starts 6-9)"),
  contactEmail: z.string().min(1, "Email is required").email("Enter a valid email"),
  website: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^https?:\/\/.+\..+/.test(v), {
      message: "Enter valid URL (e.g. https://example.com)",
    }),
  financialYear: z.enum(["APR_MAR", "JAN_DEC", "JUL_JUN"], {
    required_error: "Financial year is required",
  }),
  currency: z.string().min(1, "Currency is required"),
  timeZone: z.string().min(1, "Time zone is required"),
  subscriptionPlan: z.enum(["TRIAL", "BASIC", "STANDARD", "PROFESSIONAL", "ENTERPRISE"], {
    required_error: "Subscription plan is required",
  }),
  erpSystem: z.enum(["SAP", "ORACLE", "DYNAMICS", "OTHER", "NONE"], {
    required_error: "ERP system is required",
  }),
  externalCompanyCode: z.string().optional().or(z.literal("")),
  enabledFeatures: z.array(z.string()).min(1, "At least one feature must be enabled"),
})

type CompanyFormValues = z.infer<typeof companySchema>

const STEP_FIELDS: Record<number, (keyof CompanyFormValues)[]> = {
  0: ["companyCode", "companyName", "legalName", "companyType", "businessDomain", "gstin", "pan", "cin"],
  1: ["addressType", "line1", "line2", "city", "state", "district", "postalCode", "countryCode"],
  2: [
    "contactName",
    "contactMobile",
    "contactEmail",
    "website",
    "financialYear",
    "currency",
    "timeZone",
    "subscriptionPlan",
    "erpSystem",
    "externalCompanyCode",
    "enabledFeatures",
  ],
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function NewCompanyPage() {
  const router = useRouter()
  const createCompanyMutation = useCreateCompany()
  const [currentStep, setCurrentStep] = useState(0)
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(() => new Set([0]))
  const [successData, setSuccessData] = useState<CreateCompanyResponse | null>(null)
  const [copiedField, setCopiedField] = useState<"username" | "password" | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    control,
    trigger,
    getValues,
    clearErrors,
    formState: { errors, touchedFields },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    mode: "onTouched",
    defaultValues: {
      companyCode: "",
      companyName: "",
      legalName: "",
      companyType: undefined,
      businessDomain: undefined,
      gstin: "",
      pan: "",
      cin: "",
      addressType: "REGISTERED",
      line1: "",
      line2: "",
      city: "",
      state: "",
      district: "",
      postalCode: "",
      countryCode: "IN",
      contactName: "",
      contactMobile: "",
      contactEmail: "",
      website: "",
      financialYear: "APR_MAR",
      currency: "INR",
      timeZone: "Asia/Kolkata",
      subscriptionPlan: "ENTERPRISE",
      erpSystem: undefined,
      externalCompanyCode: "",
      enabledFeatures: ["DMS_CORE"],
    },
  })

  const businessDomainValue = useWatch({ control, name: "businessDomain" })
  const companyTypeValue = useWatch({ control, name: "companyType" })
  const addressTypeValue = useWatch({ control, name: "addressType" })
  const stateValue = useWatch({ control, name: "state" }) as string | undefined
  const contactMobileValue = useWatch({ control, name: "contactMobile" }) as string | undefined
  const financialYearValue = useWatch({ control, name: "financialYear" })
  const currencyValue = useWatch({ control, name: "currency" })
  const timeZoneValue = useWatch({ control, name: "timeZone" })
  const subscriptionPlanValue = useWatch({ control, name: "subscriptionPlan" })
  const erpSystemValue = useWatch({ control, name: "erpSystem" })
  const enabledFeatures = useWatch({ control, name: "enabledFeatures" })

  const toggleFeature = (feature: string) => {
    const current = enabledFeatures ?? []
    const next = current.includes(feature) ? current.filter((f) => f !== feature) : [...current, feature]
    setValue("enabledFeatures", next, { shouldValidate: true })
  }

  const handleCopy = async (value: string, field: "username" | "password") => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(field)
      toast.success(`${field === "username" ? "Username" : "Password"} copied to clipboard`)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      toast.error("Failed to copy")
    }
  }

  const handleGstinBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const raw = e.target.value?.toUpperCase().trim()
    if (!raw) return
    const pan = extractPanFromGstin(raw)
    if (pan) {
      const currentPan = getValues("pan")
      if (currentPan !== pan) {
        setValue("pan", pan, { shouldValidate: true, shouldDirty: true, shouldTouch: true })
        // optional soft hint; remove if too noisy
        // toast.success(`PAN auto-filled from GSTIN`)
      }
    }
  }

  const handleNext = async () => {
    const fields = STEP_FIELDS[currentStep]
    const valid = await trigger(fields, { shouldFocus: true })
    if (valid) {
      const next = Math.min(currentStep + 1, STEPS.length - 1)
      setVisitedSteps((prev) => new Set([...prev, next]))
      setCurrentStep(next)
      // Clear any premature errors for the destination step (zodResolver may have set them)
      // so step 3 doesn't show validations immediately on entry
      requestAnimationFrame(() => clearErrors(STEP_FIELDS[next]))
    } else {
      // mark current step as visited so errors become visible, but don't mark next
      setVisitedSteps((prev) => new Set([...prev, currentStep]))
      toast.error("Please fix the errors before continuing")
    }
  }

  const handleBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 0))
  }

  const handleStepClick = async (index: number) => {
    if (index === currentStep) return
    // allow going back freely
    if (index < currentStep) {
      setCurrentStep(index)
      return
    }
    // going forward: validate all intermediate steps - only those steps, never the destination step
    for (let i = currentStep; i < index; i++) {
      const valid = await trigger(STEP_FIELDS[i], { shouldFocus: true })
      if (!valid) {
        setVisitedSteps((prev) => new Set([...prev, i]))
        toast.error(`Please complete step ${i + 1} before continuing`)
        return
      }
      setVisitedSteps((prev) => new Set([...prev, i + 1]))
    }
    setVisitedSteps((prev) => new Set([...prev, index]))
    setCurrentStep(index)
    requestAnimationFrame(() => clearErrors(STEP_FIELDS[index]))
  }

  const onSubmit = (values: CompanyFormValues) => {
    const payload = {
      companyCode: values.companyCode,
      companyName: values.companyName,
      legalName: values.legalName || undefined,
      companyType: values.companyType,
      businessDomain: values.businessDomain,
      gstin: values.gstin || undefined,
      pan: values.pan || undefined,
      cin: values.cin || undefined,
      primaryAddress: {
        addressType: values.addressType,
        line1: values.line1,
        line2: values.line2 || undefined,
        city: values.city,
        state: values.state,
        district: values.district || undefined,
        postalCode: values.postalCode,
        countryCode: values.countryCode,
        primary: true as const,
      },
      primaryContact: {
        name: values.contactName,
        mobile: ensurePlus91(values.contactMobile),
        email: values.contactEmail,
      },
      website: values.website || undefined,
      financialYear: values.financialYear,
      currency: values.currency,
      timeZone: values.timeZone,
      subscriptionPlan: values.subscriptionPlan,
      erpSystem: values.erpSystem,
      externalCompanyCode: values.externalCompanyCode || undefined,
      enabledFeatures: values.enabledFeatures,
    }

    createCompanyMutation.mutate(payload, {
      onSuccess: (data) => {
        toast.success("Company created successfully")
        setSuccessData(data)
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, "Failed to create company"))
      },
    })
  }

  // Derive which steps have errors for stepper error state - only for visited steps, so entering step 3 doesn't immediately show errors
  const errorSteps = STEPS.map((_, idx) =>
    visitedSteps.has(idx) && STEP_FIELDS[idx].some((field) => !!errors[field as keyof typeof errors])
  )
    .map((hasError, idx) => (hasError ? idx : -1))
    .filter((v) => v !== -1)

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-6 overflow-hidden">
      <div className="shrink-0 space-y-4 px-4 sm:px-6">
        <PageHeader
          title="Create Company"
          description="Provision a new company — administrator is created automatically"
        />

        {/* Stepper - boxless, airy */}
        <div className="py-2">
          <Stepper
            steps={STEPS as unknown as { id: string; title: string; description?: string; icon?: React.ReactNode }[]}
            currentStep={currentStep}
            onStepChange={handleStepClick}
            errorSteps={errorSteps}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 w-full flex-1 flex-col overflow-hidden px-4 sm:px-6" noValidate>
        <div className="flex-1 overflow-y-auto space-y-8 pr-1 pb-4">
        {/* Step 1: Company Information */}
        {currentStep === 0 && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="space-y-1.5 border-b pb-5">
              <h2 className="text-[15px] font-semibold tracking-tight">Company Information</h2>
              <p className="text-sm text-muted-foreground">Core identification and statutory details</p>
            </div>

            <FieldGroup>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="companyCode">
                    Company Code <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id="companyCode"
                    placeholder="e.g. SACP"
                    aria-invalid={!!errors.companyCode}
                    {...register("companyCode")}
                  />
                  <FieldError errors={[errors.companyCode]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="companyName">
                    Company Name <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id="companyName"
                    placeholder="e.g. Shivansh Auto Components Pvt Ltd"
                    aria-invalid={!!errors.companyName}
                    {...register("companyName")}
                  />
                  <FieldError errors={[errors.companyName]} />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="legalName">Legal Name</FieldLabel>
                <Input
                  id="legalName"
                  placeholder="e.g. Shivansh Auto Components Private Limited"
                  {...register("legalName")}
                />
                <FieldError errors={[errors.legalName]} />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>
                    Company Type <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Select
                    value={companyTypeValue}
                    onValueChange={(v) => {
                      if (v) setValue("companyType", v as CompanyFormValues["companyType"], { shouldValidate: true })
                    }}
                  >
                    <SelectTrigger aria-invalid={!!errors.companyType} className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MANUFACTURER">Manufacturer</SelectItem>
                      <SelectItem value="DISTRIBUTOR">Distributor</SelectItem>
                      <SelectItem value="DEALER">Dealer</SelectItem>
                      <SelectItem value="RETAILER">Retailer</SelectItem>
                      <SelectItem value="SERVICE_PROVIDER">Service Provider</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError errors={[errors.companyType]} />
                </Field>

                <Field>
                  <FieldLabel>
                    Business Domain <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Select
                    value={businessDomainValue}
                    onValueChange={(v) => {
                      if (v) setValue("businessDomain", v as CompanyFormValues["businessDomain"], { shouldValidate: true })
                    }}
                  >
                    <SelectTrigger aria-invalid={!!errors.businessDomain} className="w-full">
                      <SelectValue placeholder="Select domain" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FMCG">FMCG</SelectItem>
                      <SelectItem value="AUTOMOTIVE">Automotive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError errors={[errors.businessDomain]} />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="gstin">GSTIN</FieldLabel>
                  {(() => {
                    const field = register("gstin", {
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                        e.target.value = e.target.value.toUpperCase()
                      },
                    })
                    return (
                      <Input
                        id="gstin"
                        placeholder="23ABCDE1234F1Z5"
                        maxLength={15}
                        className="font-mono uppercase"
                        aria-invalid={!!errors.gstin}
                        {...field}
                        onBlur={(e) => {
                          field.onBlur(e)
                          handleGstinBlur(e)
                        }}
                      />
                    )
                  })()}
                  <FieldError errors={[errors.gstin]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="pan">PAN</FieldLabel>
                  <Input
                    id="pan"
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    className="font-mono uppercase"
                    aria-invalid={!!errors.pan}
                    {...register("pan", {
                      onChange: (e) => {
                        e.target.value = e.target.value.toUpperCase()
                      },
                    })}
                  />
                  <FieldError errors={[errors.pan]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="cin">CIN</FieldLabel>
                  <Input
                    id="cin"
                    placeholder="U29309MP2021PTC056789"
                    maxLength={21}
                    className="font-mono uppercase"
                    aria-invalid={!!errors.cin}
                    {...register("cin", {
                      onChange: (e) => {
                        e.target.value = e.target.value.toUpperCase()
                      },
                    })}
                  />
                  <FieldError errors={[errors.cin]} />
                </Field>
              </div>
            </FieldGroup>
          </div>
        )}

        {/* Step 2: Company Address */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="space-y-1.5 border-b pb-5">
              <h2 className="text-[15px] font-semibold tracking-tight">Company Address</h2>
              <p className="text-sm text-muted-foreground">Primary registered address for the company</p>
            </div>

            <FieldGroup>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>
                    Address Type <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Select
                    value={addressTypeValue}
                    onValueChange={(v) => {
                      if (v) setValue("addressType", v, { shouldValidate: true })
                    }}
                  >
                    <SelectTrigger aria-invalid={!!errors.addressType} className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REGISTERED">Registered</SelectItem>
                      <SelectItem value="CORPORATE">Corporate</SelectItem>
                      <SelectItem value="BRANCH">Branch</SelectItem>
                      <SelectItem value="WAREHOUSE">Warehouse</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError errors={[errors.addressType]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="countryCode">
                    Country Code <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id="countryCode"
                    placeholder="IN"
                    maxLength={2}
                    className="uppercase"
                    aria-invalid={!!errors.countryCode}
                    {...register("countryCode", {
                      onChange: (e) => {
                        e.target.value = e.target.value.toUpperCase()
                      },
                    })}
                  />
                  <FieldError errors={[errors.countryCode]} />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="line1">
                  Address Line 1 <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="line1"
                  placeholder="Plot 18, Industrial Area, Govindpura"
                  aria-invalid={!!errors.line1}
                  {...register("line1")}
                />
                <FieldError errors={[errors.line1]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="line2">Address Line 2</FieldLabel>
                <Input id="line2" placeholder="Near JK Road" {...register("line2")} />
                <FieldError errors={[errors.line2]} />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="city">
                    City <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id="city"
                    placeholder="Bhopal"
                    aria-invalid={!!errors.city}
                    {...register("city")}
                  />
                  <FieldError errors={[errors.city]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="district">District</FieldLabel>
                  <Input id="district" placeholder="Bhopal" {...register("district")} />
                  <FieldError errors={[errors.district]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="state">
                    State <span className="text-destructive">*</span>
                  </FieldLabel>
                  <StateCombobox
                    id="state"
                    value={stateValue}
                    onValueChange={(val) =>
                      setValue("state", val, { shouldValidate: true, shouldDirty: true, shouldTouch: true })
                    }
                    hasError={!!errors.state}
                  />
                  <FieldError errors={[errors.state]} />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="postalCode">
                    Postal Code <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id="postalCode"
                    placeholder="462023"
                    maxLength={6}
                    aria-invalid={!!errors.postalCode}
                    {...register("postalCode")}
                  />
                  <FieldError errors={[errors.postalCode]} />
                </Field>
                <div className="flex items-end pb-2">
                  <p className="text-xs text-muted-foreground">
                    This address will be marked as <span className="font-medium text-foreground">Primary</span> automatically.
                  </p>
                </div>
              </div>
            </FieldGroup>
          </div>
        )}

        {/* Step 3: Rest Information */}
        {currentStep === 2 && (
          <div className="space-y-8 animate-in fade-in-50 duration-200">
            <div className="space-y-6">
              <div className="space-y-1.5 border-b pb-5">
                <h2 className="text-[15px] font-semibold tracking-tight">Primary Contact</h2>
                <p className="text-sm text-muted-foreground">Main point of contact for the company</p>
              </div>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="contactName">
                    Contact Name <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id="contactName"
                    placeholder="Rahul Verma"
                    aria-invalid={!!errors.contactName}
                    {...register("contactName")}
                  />
                  <FieldError errors={[errors.contactName]} />
                </Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="contactMobile">
                      Mobile <span className="text-destructive">*</span>
                    </FieldLabel>
                    <PhoneInput
                      id="contactMobile"
                      value={contactMobileValue ?? ""}
                      onValueChange={(v) =>
                        setValue("contactMobile", v, {
                          shouldValidate: true,
                          shouldDirty: true,
                          shouldTouch: true,
                        })
                      }
                      hasError={!!errors.contactMobile}
                      placeholder="98765 43210"
                    />
                    <FieldError errors={[errors.contactMobile]} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="contactEmail">
                      Email <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="rahul.verma@sacp-demo.com"
                      aria-invalid={!!errors.contactEmail}
                      {...register("contactEmail")}
                    />
                    <FieldError errors={[errors.contactEmail]} />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="website">Website</FieldLabel>
                  <Input id="website" placeholder="https://sacp-demo.com" {...register("website")} />
                  <FieldError errors={[errors.website]} />
                </Field>
              </FieldGroup>
            </div>

            <div className="space-y-6 pt-2">
              <div className="space-y-1.5 border-b pb-5">
                <h2 className="text-[15px] font-semibold tracking-tight">Business Configuration</h2>
                <p className="text-sm text-muted-foreground">Financial, regional and integration settings</p>
              </div>
              <FieldGroup>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field>
                    <FieldLabel>
                      Financial Year <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select
                      value={financialYearValue}
                      onValueChange={(v) => {
                        if (v) setValue("financialYear", v as CompanyFormValues["financialYear"], { shouldValidate: true })
                      }}
                    >
                      <SelectTrigger aria-invalid={!!errors.financialYear} className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="APR_MAR">Apr – Mar</SelectItem>
                        <SelectItem value="JAN_DEC">Jan – Dec</SelectItem>
                        <SelectItem value="JUL_JUN">Jul – Jun</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError errors={[errors.financialYear]} />
                  </Field>
                  <Field>
                    <FieldLabel>
                      Currency <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select
                      value={currencyValue}
                      onValueChange={(v) => {
                        if (v) setValue("currency", v, { shouldValidate: true })
                      }}
                    >
                      <SelectTrigger aria-invalid={!!errors.currency} className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR – Indian Rupee</SelectItem>
                        <SelectItem value="USD">USD – US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR – Euro</SelectItem>
                        <SelectItem value="GBP">GBP – Pound</SelectItem>
                        <SelectItem value="JPY">JPY – Yen</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError errors={[errors.currency]} />
                  </Field>
                  <Field>
                    <FieldLabel>
                      Time Zone <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select
                      value={timeZoneValue}
                      onValueChange={(v) => {
                        if (v) setValue("timeZone", v, { shouldValidate: true })
                      }}
                    >
                      <SelectTrigger aria-invalid={!!errors.timeZone} className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                        <SelectItem value="Asia/Dubai">Asia/Dubai</SelectItem>
                        <SelectItem value="Asia/Singapore">Asia/Singapore</SelectItem>
                        <SelectItem value="Europe/London">Europe/London</SelectItem>
                        <SelectItem value="America/New_York">America/New_York</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError errors={[errors.timeZone]} />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>
                      Subscription Plan <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select
                      value={subscriptionPlanValue}
                      onValueChange={(v) => {
                        if (v) setValue("subscriptionPlan", v as CompanyFormValues["subscriptionPlan"], { shouldValidate: true })
                      }}
                    >
                      <SelectTrigger aria-invalid={!!errors.subscriptionPlan} className="w-full">
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRIAL">Trial</SelectItem>
                        <SelectItem value="BASIC">Basic</SelectItem>
                        <SelectItem value="STANDARD">Standard</SelectItem>
                        <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                        <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError errors={[errors.subscriptionPlan]} />
                  </Field>
                  <Field>
                    <FieldLabel>
                      ERP System <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select
                      value={erpSystemValue}
                      onValueChange={(v) => {
                        if (v) setValue("erpSystem", v as CompanyFormValues["erpSystem"], { shouldValidate: true })
                      }}
                    >
                      <SelectTrigger aria-invalid={!!errors.erpSystem} className="w-full">
                        <SelectValue placeholder="Select ERP" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SAP">SAP</SelectItem>
                        <SelectItem value="ORACLE">Oracle</SelectItem>
                        <SelectItem value="DYNAMICS">Dynamics</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                        <SelectItem value="NONE">None</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError errors={[errors.erpSystem]} />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="externalCompanyCode">External Company Code</FieldLabel>
                  <Input id="externalCompanyCode" placeholder="SACP1001" {...register("externalCompanyCode")} />
                  <FieldError errors={[errors.externalCompanyCode]} />
                </Field>
              </FieldGroup>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-1.5 border-b pb-5">
                <h2 className="text-[15px] font-semibold tracking-tight">Features</h2>
                <p className="text-sm text-muted-foreground">Select at least one feature to enable for this company.</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {FEATURES.map((feature) => (
                  <label
                    key={feature.value}
                    className="flex items-start gap-3 rounded-lg border bg-muted/20 px-3.5 py-3 cursor-pointer transition-colors hover:bg-muted/40 has-[:checked]:border-primary has-[:checked]:bg-primary/[0.06]"
                  >
                    <Checkbox
                      checked={enabledFeatures?.includes(feature.value) ?? false}
                      onCheckedChange={() => toggleFeature(feature.value)}
                    />
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">{feature.label}</div>
                      <div className="text-xs text-muted-foreground">{feature.description}</div>
                    </div>
                  </label>
                ))}
              </div>
              <FieldError errors={[errors.enabledFeatures]} />
            </div>
          </div>
        )}

        </div>

        {/* Footer - fixed, outside scroll */}
        <div className="flex shrink-0 items-center justify-between border-t bg-background pt-4 pb-2">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 0 ? () => router.back() : handleBack}
          >
            <ArrowLeft className="size-4" />
            {currentStep === 0 ? "Cancel" : "Back"}
          </Button>

          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:block">
              Step {currentStep + 1} of {STEPS.length}
            </span>
            {currentStep < STEPS.length - 1 ? (
              <Button type="button" onClick={handleNext}>
                Next
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={createCompanyMutation.isPending}>
                {createCompanyMutation.isPending ? "Creating..." : "Create Company"}
              </Button>
            )}
          </div>
        </div>
      </form>

      <Dialog open={!!successData} onOpenChange={(open) => { if (!open) setSuccessData(null) }}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-6 text-green-600" />
              <DialogTitle>Company Created Successfully</DialogTitle>
            </div>
            <DialogDescription>
              Company <span className="font-medium text-foreground">{successData?.company.companyName}</span> has been provisioned. Save the administrator credentials below — the temporary password will not be shown again.
            </DialogDescription>
          </DialogHeader>

          {successData && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 shadow-xs">
                  <span className="flex-1 font-mono text-sm break-all">{successData.bootstrapAdmin.username}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleCopy(successData.bootstrapAdmin.username, "username")}
                    aria-label="Copy username"
                  >
                    {copiedField === "username" ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Temporary Password</label>
                <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 shadow-xs">
                  <span className="flex-1 font-mono text-sm break-all">{successData.bootstrapAdmin.temporaryPassword}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleCopy(successData.bootstrapAdmin.temporaryPassword, "password")}
                    aria-label="Copy password"
                  >
                    {copiedField === "password" ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
                  </Button>
                </div>
                {successData.bootstrapAdmin.mustChangePassword && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Administrator must change password on first login.
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => router.push("/companies")} className="w-full sm:w-auto">
              Go to Companies
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
