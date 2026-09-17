"use client"

import * as React from "react"
import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { PageHeader } from "@/components/common/PageHeader"
import { LoadingState } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { Stepper } from "@/components/ui/stepper"
import { StateCombobox } from "@/components/common/StateCombobox"
import { PhoneInput } from "@/components/common/PhoneInput"
import { useCompany } from "@/features/companies/hooks/use-company"
import { useCompanyAddresses } from "@/features/companies/hooks/use-company-addresses"
import { useUpdateCompany } from "@/features/companies/hooks/use-update-company"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { extractPanFromGstin, ensurePlus91 } from "@/lib/utils"
import { COMPANY_CREATE_STEPS } from "@/features/companies/configs/company.config"
import {
  companyEditSchema,
  type CompanyEditFormValues,
} from "@/features/companies/schemas/company.schema"
import type { UpdateCompanyRequest } from "@/features/companies/api/company.types"

const EDIT_STEP_FIELDS: Record<number, (keyof CompanyEditFormValues)[]> = {
  0: ["companyName", "legalName", "businessDomain", "gstin", "pan", "cin"],
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
  ],
}

function toFormDefaults(): CompanyEditFormValues {
  return {
    companyName: "",
    legalName: "",
    businessDomain: undefined as unknown as CompanyEditFormValues["businessDomain"],
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
    financialYear: undefined as unknown as CompanyEditFormValues["financialYear"],
    currency: "",
    timeZone: "",
    subscriptionPlan: undefined as unknown as CompanyEditFormValues["subscriptionPlan"],
    erpSystem: undefined as unknown as CompanyEditFormValues["erpSystem"],
    externalCompanyCode: "",
  }
}

export default function EditCompanyPage() {
  const router = useRouter()
  const params = useParams<{ companyUuid: string }>()
  const companyUuid = params.companyUuid

  const { data: company, isLoading, error, refetch } = useCompany(companyUuid)
  const { data: addresses, isLoading: addressesLoading } =
    useCompanyAddresses(companyUuid)
  const updateMutation = useUpdateCompany()
  const [currentStep, setCurrentStep] = useState(0)
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(() => new Set([0]))
  const [initFor, setInitFor] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    control,
    trigger,
    getValues,
    clearErrors,
    reset,
    formState: { errors },
  } = useForm<CompanyEditFormValues>({
    resolver: zodResolver(companyEditSchema),
    mode: "onTouched",
    defaultValues: toFormDefaults(),
  })

  // Prefill once the detail loads (and when navigating between companies).
  // The primary address comes from the addresses API (primary first,
  // otherwise the first address), falling back to the embedded detail.
  if (company && !addressesLoading && initFor !== company.publicId) {
    setInitFor(company.publicId)
    const apiAddress =
      addresses?.find((a) => a.isPrimary) ?? addresses?.[0]
    reset({
      companyName: company.companyName ?? "",
      legalName: company.legalName ?? "",
      businessDomain: company.businessDomain as CompanyEditFormValues["businessDomain"],
      gstin: company.gstin ?? "",
      pan: company.pan ?? "",
      cin: company.cin ?? "",
      addressType:
        apiAddress?.addressType ??
        company.primaryAddress?.addressType ??
        "REGISTERED",
      line1:
        apiAddress?.addressLine1 ?? company.primaryAddress?.line1 ?? "",
      line2:
        apiAddress?.addressLine2 ?? company.primaryAddress?.line2 ?? "",
      city: apiAddress?.city ?? company.primaryAddress?.city ?? "",
      state: apiAddress?.state ?? company.primaryAddress?.state ?? "",
      district: company.primaryAddress?.district ?? "",
      postalCode:
        apiAddress?.postalCode ?? company.primaryAddress?.postalCode ?? "",
      countryCode:
        apiAddress?.countryCode ??
        company.primaryAddress?.countryCode ??
        "IN",
      contactName: company.primaryContact?.name ?? "",
      contactMobile: company.primaryContact?.mobile ?? "",
      contactEmail: company.primaryContact?.email ?? "",
      website: company.website ?? "",
      financialYear: company.financialYear as CompanyEditFormValues["financialYear"],
      currency: company.currency ?? "",
      timeZone: company.timeZone ?? "",
      subscriptionPlan: company.subscriptionPlan as CompanyEditFormValues["subscriptionPlan"],
      erpSystem: company.erpSystem as CompanyEditFormValues["erpSystem"],
      externalCompanyCode: company.externalCompanyCode ?? "",
    })
  }

  const businessDomainValue = useWatch({ control, name: "businessDomain" })
  const addressTypeValue = useWatch({ control, name: "addressType" })
  const stateValue = useWatch({ control, name: "state" }) as string | undefined
  const contactMobileValue = useWatch({ control, name: "contactMobile" }) as
    | string
    | undefined
  const financialYearValue = useWatch({ control, name: "financialYear" })
  const currencyValue = useWatch({ control, name: "currency" })
  const timeZoneValue = useWatch({ control, name: "timeZone" })
  const subscriptionPlanValue = useWatch({ control, name: "subscriptionPlan" })
  const erpSystemValue = useWatch({ control, name: "erpSystem" })

  const handleGstinBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const raw = e.target.value?.toUpperCase().trim()
    if (!raw) return
    const pan = extractPanFromGstin(raw)
    if (pan) {
      const currentPan = getValues("pan")
      if (currentPan !== pan) {
        setValue("pan", pan, { shouldValidate: true, shouldDirty: true, shouldTouch: true })
      }
    }
  }

  const handleNext = async () => {
    const fields = EDIT_STEP_FIELDS[currentStep]
    const valid = await trigger(fields, { shouldFocus: true })
    if (valid) {
      const next = Math.min(currentStep + 1, COMPANY_CREATE_STEPS.length - 1)
      setVisitedSteps((prev) => new Set([...prev, next]))
      setCurrentStep(next)
      // Clear any premature errors for the destination step (zodResolver may have set them)
      requestAnimationFrame(() => clearErrors(EDIT_STEP_FIELDS[next]))
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
      const valid = await trigger(EDIT_STEP_FIELDS[i], { shouldFocus: true })
      if (!valid) {
        setVisitedSteps((prev) => new Set([...prev, i]))
        toast.error(`Please complete step ${i + 1} before continuing`)
        return
      }
      setVisitedSteps((prev) => new Set([...prev, i + 1]))
    }
    setVisitedSteps((prev) => new Set([...prev, index]))
    setCurrentStep(index)
    requestAnimationFrame(() => clearErrors(EDIT_STEP_FIELDS[index]))
  }

  const onSubmit = (values: CompanyEditFormValues) => {
    const payload: UpdateCompanyRequest = {
      companyName: values.companyName,
      legalName: values.legalName || undefined,
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
        primary: true,
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
    }
    updateMutation.mutate(
      { companyUuid, input: payload },
      {
        onSuccess: () => {
          toast.success("Company updated successfully")
          router.push(`/companies/${companyUuid}`)
        },
        onError: (err) => {
          toast.error(getApiErrorMessage(err, "Failed to update company"))
        },
      }
    )
  }

  const stepperSteps = COMPANY_CREATE_STEPS.map((s) => ({
    ...s,
    icon: <s.icon className="size-4" />,
  }))

  // Derive which steps have errors for stepper error state - only for visited steps
  const errorSteps = COMPANY_CREATE_STEPS.map((_, idx) =>
    visitedSteps.has(idx) && EDIT_STEP_FIELDS[idx].some((field) => !!errors[field as keyof typeof errors])
  )
    .map((hasError, idx) => (hasError ? idx : -1))
    .filter((v) => v !== -1)

  if (isLoading || addressesLoading) return <LoadingState />
  if (error) return <ErrorState onRetry={refetch} />
  if (!company) return <ErrorState message="Company not found" />

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-6 overflow-hidden">
      <div className="shrink-0 space-y-4 px-4 sm:px-6">
        <PageHeader
          title={`Edit ${company.companyName}`}
          description={`Company code: ${company.companyCode}`}
        />

        {/* Stepper - boxless, airy */}
        <div className="py-2">
          <Stepper
            steps={stepperSteps}
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
                  <FieldLabel htmlFor="companyCode">Company Code</FieldLabel>
                  <Input
                    id="companyCode"
                    value={company.companyCode}
                    disabled
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Code cannot be changed after creation.
                  </p>
                </Field>
                <Field>
                  <FieldLabel htmlFor="companyName">
                    Company Name <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id="companyName"
                    aria-invalid={!!errors.companyName}
                    {...register("companyName")}
                  />
                  <FieldError errors={[errors.companyName]} />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="legalName">Legal Name</FieldLabel>
                <Input id="legalName" {...register("legalName")} />
                <FieldError errors={[errors.legalName]} />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Company Type</FieldLabel>
                  <Input value={company.companyType ?? "—"} disabled />
                  <p className="text-xs text-muted-foreground">
                    Type cannot be changed after creation.
                  </p>
                </Field>
                <Field>
                  <FieldLabel>
                    Business Domain <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Select
                    value={businessDomainValue}
                    onValueChange={(v) => {
                      if (v) setValue("businessDomain", v as CompanyEditFormValues["businessDomain"], { shouldValidate: true })
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
                <Input id="line1" aria-invalid={!!errors.line1} {...register("line1")} />
                <FieldError errors={[errors.line1]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="line2">Address Line 2</FieldLabel>
                <Input id="line2" {...register("line2")} />
                <FieldError errors={[errors.line2]} />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="city">
                    City <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input id="city" aria-invalid={!!errors.city} {...register("city")} />
                  <FieldError errors={[errors.city]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="district">District</FieldLabel>
                  <Input id="district" {...register("district")} />
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
                      aria-invalid={!!errors.contactEmail}
                      {...register("contactEmail")}
                    />
                    <FieldError errors={[errors.contactEmail]} />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="website">Website</FieldLabel>
                  <Input id="website" placeholder="https://example.com" {...register("website")} />
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
                        if (v) setValue("financialYear", v as CompanyEditFormValues["financialYear"], { shouldValidate: true })
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
                        if (v) setValue("subscriptionPlan", v as CompanyEditFormValues["subscriptionPlan"], { shouldValidate: true })
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
                        if (v) setValue("erpSystem", v as CompanyEditFormValues["erpSystem"], { shouldValidate: true })
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
                  <Input id="externalCompanyCode" {...register("externalCompanyCode")} />
                  <FieldError errors={[errors.externalCompanyCode]} />
                </Field>
              </FieldGroup>
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
              Step {currentStep + 1} of {COMPANY_CREATE_STEPS.length}
            </span>
            {currentStep < COMPANY_CREATE_STEPS.length - 1 ? (
              <Button type="button" onClick={handleNext}>
                Next
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
