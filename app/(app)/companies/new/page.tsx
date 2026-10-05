"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  ArrowLeft,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { PageHeader } from "@/components/common/PageHeader"
import { LoginCredentialsDialog } from "@/components/common/LoginCredentialsDialog"
import { Stepper } from "@/components/ui/stepper"
import { StateCombobox } from "@/components/common/StateCombobox"
import {
  FormPhoneField,
  FormSelectField,
  FormTextField,
} from "@/components/common/form-fields"
import { useCreateCompany } from "@/features/companies/hooks/use-create-company"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { extractPanFromGstin, ensurePlus91 } from "@/lib/utils"
import type { CreateCompanyResponse } from "@/features/companies/api/company.types"
import {
  COMPANY_CREATE_STEPS,
  COMPANY_FEATURES,
  COMPANY_TYPE_OPTIONS,
} from "@/features/companies/configs/company.config"
import {
  STEP_FIELDS,
  companySchema,
  type CompanyFormValues,
} from "@/features/companies/schemas/company.schema"

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function NewCompanyPage() {
  const router = useRouter()
  const createCompanyMutation = useCreateCompany()
  const [currentStep, setCurrentStep] = useState(0)
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(() => new Set([0]))
  const [successData, setSuccessData] = useState<CreateCompanyResponse | null>(null)

  const {
    handleSubmit,
    setValue,
    control,
    trigger,
    getValues,
    clearErrors,
    formState: { errors },
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

  const stateValue = useWatch({ control, name: "state" }) as string | undefined
  const enabledFeatures = useWatch({ control, name: "enabledFeatures" })

  const toggleFeature = (feature: string) => {
    const current = enabledFeatures ?? []
    const next = current.includes(feature) ? current.filter((f) => f !== feature) : [...current, feature]
    setValue("enabledFeatures", next, { shouldValidate: true })
  }

  // FormTextField has no uppercase transform, so normalize gstin/pan/cin/
  // countryCode to uppercase on blur (keeps zod regex validation passing)
  // and again in the submit payload. GSTIN blur also auto-fills PAN.
  const handleUpperBlur =
    (fieldName: "gstin" | "pan" | "cin" | "countryCode") =>
    (e: React.FocusEvent) => {
      const input = e.target as HTMLInputElement
      const upper = (input.value ?? "").toUpperCase()
      if (input.value && upper !== input.value) {
        setValue(fieldName, upper, { shouldValidate: true, shouldDirty: true })
      }
      if (fieldName === "gstin") {
        const raw = upper.trim()
        if (!raw) return
        const pan = extractPanFromGstin(raw)
        if (pan) {
          const currentPan = getValues("pan")
          if (currentPan !== pan) {
            setValue("pan", pan, { shouldValidate: true, shouldDirty: true, shouldTouch: true })
          }
        }
      }
    }

  const handleNext = async () => {
    const fields = STEP_FIELDS[currentStep]
    const valid = await trigger(fields, { shouldFocus: true })
    if (valid) {
      const next = Math.min(currentStep + 1, COMPANY_CREATE_STEPS.length - 1)
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
      gstin: values.gstin?.toUpperCase() || undefined,
      pan: values.pan?.toUpperCase() || undefined,
      cin: values.cin?.toUpperCase() || undefined,
      primaryAddress: {
        addressType: values.addressType,
        line1: values.line1,
        line2: values.line2 || undefined,
        city: values.city,
        state: values.state,
        district: values.district || undefined,
        postalCode: values.postalCode,
        countryCode: values.countryCode.toUpperCase(),
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

  const stepperSteps = COMPANY_CREATE_STEPS.map((s) => ({
    ...s,
    icon: <s.icon className="size-4" />,
  }))

  // Derive which steps have errors for stepper error state - only for visited steps, so entering step 3 doesn't immediately show errors
  const errorSteps = COMPANY_CREATE_STEPS.map((_, idx) =>
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
                <FormTextField
                  control={control}
                  name="companyCode"
                  label={<>Company Code <span className="text-destructive">*</span></>}
                  placeholder="Enter company code"
                />
                <FormTextField
                  control={control}
                  name="companyName"
                  label={<>Company Name <span className="text-destructive">*</span></>}
                  placeholder="Enter company name"
                />
              </div>

              <FormTextField
                control={control}
                name="legalName"
                label="Legal Name"
                placeholder="Enter legal name"
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormSelectField
                  control={control}
                  name="companyType"
                  label={<>Company Type <span className="text-destructive">*</span></>}
                  placeholder="Select company type"
                  options={COMPANY_TYPE_OPTIONS}
                />
                <FormSelectField
                  control={control}
                  name="businessDomain"
                  label={<>Business Domain <span className="text-destructive">*</span></>}
                  placeholder="Select business domain"
                  options={[
                    { value: "FMCG", label: "FMCG" },
                    { value: "AUTOMOTIVE", label: "Automotive" },
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div onBlur={handleUpperBlur("gstin")}>
                  <FormTextField
                    control={control}
                    name="gstin"
                    label="GSTIN"
                    placeholder="Enter GSTIN"
                    maxLength={15}
                  />
                </div>
                <div onBlur={handleUpperBlur("pan")}>
                  <FormTextField
                    control={control}
                    name="pan"
                    label="PAN"
                    placeholder="Enter PAN"
                    maxLength={10}
                  />
                </div>
                <div onBlur={handleUpperBlur("cin")}>
                  <FormTextField
                    control={control}
                    name="cin"
                    label="CIN"
                    placeholder="Enter CIN"
                    maxLength={21}
                  />
                </div>
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
                <FormSelectField
                  control={control}
                  name="addressType"
                  label={<>Address Type <span className="text-destructive">*</span></>}
                  placeholder="Select address type"
                  options={[
                    { value: "REGISTERED", label: "Registered" },
                    { value: "CORPORATE", label: "Corporate" },
                    { value: "BRANCH", label: "Branch" },
                    { value: "WAREHOUSE", label: "Warehouse" },
                  ]}
                />
                <div onBlur={handleUpperBlur("countryCode")}>
                  <FormTextField
                    control={control}
                    name="countryCode"
                    label={<>Country Code <span className="text-destructive">*</span></>}
                    placeholder="Enter country code"
                    maxLength={2}
                  />
                </div>
              </div>

              <FormTextField
                control={control}
                name="line1"
                label={<>Address Line 1 <span className="text-destructive">*</span></>}
                placeholder="Enter address line 1"
              />

              <FormTextField
                control={control}
                name="line2"
                label="Address Line 2"
                placeholder="Enter address line 2"
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormTextField
                  control={control}
                  name="city"
                  label={<>City <span className="text-destructive">*</span></>}
                  placeholder="Enter city"
                />
                <FormTextField
                  control={control}
                  name="district"
                  label="District"
                  placeholder="Enter district"
                />
                <Field>
                  <FieldLabel>
                    State <span className="text-destructive">*</span>
                  </FieldLabel>
                  <StateCombobox
                    id="state"
                    value={stateValue}
                    onValueChange={(val) =>
                      setValue("state", val, { shouldValidate: true, shouldDirty: true, shouldTouch: true })
                    }
                    hasError={!!errors.state}
                    placeholder="Select state"
                  />
                  <FieldError errors={[errors.state]} />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormTextField
                  control={control}
                  name="postalCode"
                  label={<>Postal Code <span className="text-destructive">*</span></>}
                  placeholder="Enter postal code"
                  maxLength={6}
                />
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
                <FormTextField
                  control={control}
                  name="contactName"
                  label={<>Contact Name <span className="text-destructive">*</span></>}
                  placeholder="Enter contact name"
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormPhoneField
                    control={control}
                    name="contactMobile"
                    label={<>Mobile <span className="text-destructive">*</span></>}
                    placeholder="Enter mobile number"
                  />
                  <FormTextField
                    control={control}
                    name="contactEmail"
                    label={<>Email <span className="text-destructive">*</span></>}
                    type="email"
                    placeholder="Enter contact email"
                  />
                </div>
                <FormTextField
                  control={control}
                  name="website"
                  label="Website"
                  placeholder="Enter website"
                />
              </FieldGroup>
            </div>

            <div className="space-y-6 pt-2">
              <div className="space-y-1.5 border-b pb-5">
                <h2 className="text-[15px] font-semibold tracking-tight">Business Configuration</h2>
                <p className="text-sm text-muted-foreground">Financial, regional and integration settings</p>
              </div>
              <FieldGroup>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <FormSelectField
                    control={control}
                    name="financialYear"
                    label={<>Financial Year <span className="text-destructive">*</span></>}
                    placeholder="Select financial year"
                    options={[
                      { value: "APR_MAR", label: "Apr – Mar" },
                      { value: "JAN_DEC", label: "Jan – Dec" },
                      { value: "JUL_JUN", label: "Jul – Jun" },
                    ]}
                  />
                  <FormSelectField
                    control={control}
                    name="currency"
                    label={<>Currency <span className="text-destructive">*</span></>}
                    placeholder="Select currency"
                    options={[
                      { value: "INR", label: "INR – Indian Rupee" },
                      { value: "USD", label: "USD – US Dollar" },
                      { value: "EUR", label: "EUR – Euro" },
                      { value: "GBP", label: "GBP – Pound" },
                      { value: "JPY", label: "JPY – Yen" },
                    ]}
                  />
                  <FormSelectField
                    control={control}
                    name="timeZone"
                    label={<>Time Zone <span className="text-destructive">*</span></>}
                    placeholder="Select time zone"
                    options={[
                      { value: "Asia/Kolkata", label: "Asia/Kolkata" },
                      { value: "Asia/Dubai", label: "Asia/Dubai" },
                      { value: "Asia/Singapore", label: "Asia/Singapore" },
                      { value: "Europe/London", label: "Europe/London" },
                      { value: "America/New_York", label: "America/New_York" },
                    ]}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormSelectField
                    control={control}
                    name="subscriptionPlan"
                    label={<>Subscription Plan <span className="text-destructive">*</span></>}
                    placeholder="Select subscription plan"
                    options={[
                      { value: "TRIAL", label: "Trial" },
                      { value: "BASIC", label: "Basic" },
                      { value: "STANDARD", label: "Standard" },
                      { value: "PROFESSIONAL", label: "Professional" },
                      { value: "ENTERPRISE", label: "Enterprise" },
                    ]}
                  />
                  <FormSelectField
                    control={control}
                    name="erpSystem"
                    label={<>ERP System <span className="text-destructive">*</span></>}
                    placeholder="Select ERP system"
                    options={[
                      { value: "SAP", label: "SAP" },
                      { value: "ORACLE", label: "Oracle" },
                      { value: "DYNAMICS", label: "Dynamics" },
                      { value: "OTHER", label: "Other" },
                      { value: "NONE", label: "None" },
                    ]}
                  />
                </div>

                <FormTextField
                  control={control}
                  name="externalCompanyCode"
                  label="External Company Code"
                  placeholder="Enter external company code"
                />
              </FieldGroup>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-1.5 border-b pb-5">
                <h2 className="text-[15px] font-semibold tracking-tight">Features</h2>
                <p className="text-sm text-muted-foreground">Select at least one feature to enable for this company.</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {COMPANY_FEATURES.map((feature) => (
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
              Step {currentStep + 1} of {COMPANY_CREATE_STEPS.length}
            </span>
            {currentStep < COMPANY_CREATE_STEPS.length - 1 ? (
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

      <LoginCredentialsDialog
        data={
          successData
            ? {
                username: successData.bootstrapAdmin.username,
                temporaryPassword: successData.bootstrapAdmin.temporaryPassword,
                mustChangePassword: successData.bootstrapAdmin.mustChangePassword,
              }
            : null
        }
        title="Company Created Successfully"
        description={
          <>
            Company{" "}
            <span className="font-medium text-foreground">
              {successData?.company.companyName}
            </span>{" "}
            has been provisioned. Save the administrator credentials below —
            the temporary password will not be shown again.
          </>
        }
        footer={
          <Button onClick={() => router.push("/companies")} className="w-full sm:w-auto">
            Go to Companies
          </Button>
        }
        onClose={() => setSuccessData(null)}
      />
    </div>
  )
}
