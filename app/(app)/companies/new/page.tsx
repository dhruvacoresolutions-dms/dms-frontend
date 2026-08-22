"use client"

import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
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
import { PasswordInput } from "@/components/auth/PasswordInput"
import { PageHeader } from "@/components/common/PageHeader"
import { useCreateCompany } from "@/features/companies/hooks/use-create-company"
import { getApiErrorMessage } from "@/lib/api/api-error"

const FEATURES = [
  { value: "DMS_CORE", label: "DMS Core", description: "Core document management capabilities" },
  { value: "GEOGRAPHY_MANAGEMENT", label: "Geography Management", description: "Geography administration capabilities" },
] as const

const companySchema = z.object({
  companyCode: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(40, "Code must not exceed 40 characters")
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Code must contain only letters, numbers, hyphens, or underscores"
    ),
  companyName: z.string().min(1, "Company name is required"),
  legalName: z.string().optional(),
  businessDomain: z.enum(["FMCG", "AUTOMOTIVE"], {
    required_error: "Business domain is required",
  }),
  erpSystem: z.enum(["SAP", "ORACLE", "DYNAMICS", "OTHER", "NONE"], {
    required_error: "ERP system is required",
  }),
  enabledFeatures: z
    .array(z.string())
    .min(1, "At least one feature must be enabled"),
  addressType: z.string().min(1, "Address type is required"),
  line1: z.string().min(1, "Address line 1 is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  countryCode: z
    .string()
    .length(2, "Country code must be exactly 2 characters"),
  adminUsername: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(100, "Username must not exceed 100 characters")
    .regex(
      /^[A-Za-z0-9._-]+$/,
      "Username must contain only letters, numbers, dots, hyphens, or underscores"
    ),
  adminDisplayName: z.string().min(1, "Display name is required"),
  adminEmail: z.string().email("Enter a valid email address"),
  adminPassword: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(128, "Password must not exceed 128 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a number")
    .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
})

type CompanyFormValues = z.infer<typeof companySchema>

export default function NewCompanyPage() {
  const router = useRouter()
  const createCompanyMutation = useCreateCompany()

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyCode: "",
      companyName: "",
      legalName: "",
      businessDomain: undefined,
      erpSystem: undefined,
      enabledFeatures: ["DMS_CORE"],
      addressType: "REGISTERED",
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
      countryCode: "IN",
      adminUsername: "",
      adminDisplayName: "",
      adminEmail: "",
      adminPassword: "",
    },
  })

  const enabledFeatures = useWatch({ control, name: "enabledFeatures" })
  const businessDomainValue = useWatch({ control, name: "businessDomain" })
  const erpSystemValue = useWatch({ control, name: "erpSystem" })
  const addressTypeValue = useWatch({ control, name: "addressType" })

  const toggleFeature = (feature: string) => {
    const current = enabledFeatures ?? []
    const next = current.includes(feature)
      ? current.filter((f) => f !== feature)
      : [...current, feature]
    setValue("enabledFeatures", next, { shouldValidate: true })
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Create Company"
        description="Provision a new company with an administrator"
      />

      <form
        className="max-w-2xl space-y-6"
        onSubmit={handleSubmit((values) => {
          const { line1, line2, city, state, postalCode, countryCode, addressType, ...rest } = values
          createCompanyMutation.mutate(
            {
              ...rest,
              primaryAddress: {
                addressType,
                line1,
                line2,
                city,
                state,
                postalCode,
                countryCode,
                primary: true,
              },
            },
            {
              onSuccess: (company) => {
                toast.success("Company created successfully")
                router.push(`/companies/${company.publicId}`)
              },
              onError: (error) => {
                const apiError = getApiErrorMessage(
                  error,
                  "Failed to create company"
                )
                toast.error(apiError)
              },
            }
          )
        })}
      >
        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Company Information</h2>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="companyCode">Company Code</FieldLabel>
              <Input
                id="companyCode"
                placeholder="e.g. ACME-CORP"
                aria-invalid={!!errors.companyCode}
                {...register("companyCode")}
              />
              <FieldError errors={[errors.companyCode]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="companyName">Company Name</FieldLabel>
              <Input
                id="companyName"
                placeholder="e.g. Acme Corporation"
                aria-invalid={!!errors.companyName}
                {...register("companyName")}
              />
              <FieldError errors={[errors.companyName]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="legalName">Legal Name (optional)</FieldLabel>
              <Input
                id="legalName"
                placeholder="e.g. Acme Corporation Pvt. Ltd."
                {...register("legalName")}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Business Domain</FieldLabel>
                <Select
                  value={businessDomainValue}
                  onValueChange={(v) => {
                    if (v) setValue("businessDomain", v as CompanyFormValues["businessDomain"], { shouldValidate: true })
                  }}
                >
                  <SelectTrigger aria-invalid={!!errors.businessDomain}>
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FMCG">FMCG</SelectItem>
                    <SelectItem value="AUTOMOTIVE">Automotive</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError errors={[errors.businessDomain]} />
              </Field>
              <Field>
                <FieldLabel>ERP System</FieldLabel>
                <Select
                  value={erpSystemValue}
                  onValueChange={(v) => {
                    if (v) setValue("erpSystem", v as CompanyFormValues["erpSystem"], { shouldValidate: true })
                  }}
                >
                  <SelectTrigger aria-invalid={!!errors.erpSystem}>
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
          </FieldGroup>
        </div>

        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Features</h2>
          <p className="text-sm text-muted-foreground">
            Select at least one feature to enable for this company.
          </p>
          <div className="grid grid-cols-1 gap-3">
            {FEATURES.map((feature) => (
              <label
                key={feature.value}
                className="flex items-start gap-3 rounded-md border p-3 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <Checkbox
                  checked={enabledFeatures?.includes(feature.value) ?? false}
                  onCheckedChange={() => toggleFeature(feature.value)}
                />
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">{feature.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {feature.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
          <FieldError errors={[errors.enabledFeatures]} />
        </div>

        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Primary Address</h2>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Address Type</FieldLabel>
                <Select
                  value={addressTypeValue}
                  onValueChange={(v) => {
                    if (v) setValue("addressType", v, { shouldValidate: true })
                  }}
                >
                  <SelectTrigger aria-invalid={!!errors.addressType}>
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
                <FieldLabel htmlFor="countryCode">Country Code</FieldLabel>
                <Input
                  id="countryCode"
                  placeholder="e.g. IN"
                  maxLength={2}
                  aria-invalid={!!errors.countryCode}
                  {...register("countryCode")}
                />
                <FieldError errors={[errors.countryCode]} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="line1">Address Line 1</FieldLabel>
              <Input
                id="line1"
                placeholder="e.g. 123 Main Street"
                aria-invalid={!!errors.line1}
                {...register("line1")}
              />
              <FieldError errors={[errors.line1]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="line2">Address Line 2 (optional)</FieldLabel>
              <Input
                id="line2"
                placeholder="e.g. Suite 456"
                {...register("line2")}
              />
            </Field>
            <div className="grid grid-cols-3 gap-4">
              <Field>
                <FieldLabel htmlFor="city">City</FieldLabel>
                <Input
                  id="city"
                  placeholder="e.g. Mumbai"
                  aria-invalid={!!errors.city}
                  {...register("city")}
                />
                <FieldError errors={[errors.city]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="state">State (optional)</FieldLabel>
                <Input
                  id="state"
                  placeholder="e.g. Maharashtra"
                  {...register("state")}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="postalCode">Postal Code (optional)</FieldLabel>
                <Input
                  id="postalCode"
                  placeholder="e.g. 400001"
                  {...register("postalCode")}
                />
              </Field>
            </div>
          </FieldGroup>
        </div>

        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Administrator</h2>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="adminUsername">Username</FieldLabel>
              <Input
                id="adminUsername"
                placeholder="e.g. admin"
                aria-invalid={!!errors.adminUsername}
                {...register("adminUsername")}
              />
              <FieldError errors={[errors.adminUsername]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="adminDisplayName">Display Name</FieldLabel>
              <Input
                id="adminDisplayName"
                placeholder="e.g. John Doe"
                aria-invalid={!!errors.adminDisplayName}
                {...register("adminDisplayName")}
              />
              <FieldError errors={[errors.adminDisplayName]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="adminEmail">Email</FieldLabel>
              <Input
                id="adminEmail"
                type="email"
                placeholder="e.g. admin@acme.com"
                aria-invalid={!!errors.adminEmail}
                {...register("adminEmail")}
              />
              <FieldError errors={[errors.adminEmail]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="adminPassword">Password</FieldLabel>
              <PasswordInput
                id="adminPassword"
                placeholder="Minimum 12 characters"
                aria-invalid={!!errors.adminPassword}
                {...register("adminPassword")}
              />
              <FieldError errors={[errors.adminPassword]} />
            </Field>
          </FieldGroup>
        </div>

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={createCompanyMutation.isPending}
          >
            {createCompanyMutation.isPending
              ? "Creating..."
              : "Create Company"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
