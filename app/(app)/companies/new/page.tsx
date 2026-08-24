"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Check, Copy, CheckCircle2 } from "lucide-react"
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
import { useCreateCompany } from "@/features/companies/hooks/use-create-company"
import { getApiErrorMessage } from "@/lib/api/api-error"
import type { CreateCompanyResponse } from "@/features/companies/api/company.types"

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
})

type CompanyFormValues = z.infer<typeof companySchema>

export default function NewCompanyPage() {
  const router = useRouter()
  const createCompanyMutation = useCreateCompany()
  const [successData, setSuccessData] = useState<CreateCompanyResponse | null>(null)
  const [copiedField, setCopiedField] = useState<"username" | "password" | null>(null)

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

  const handleGoToCompanies = () => {
    router.push("/companies")
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Create Company"
        description="Provision a new company — administrator is created automatically"
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
              onSuccess: (data) => {
                toast.success("Company created successfully")
                setSuccessData(data)
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
        <div className="rounded-xl border bg-card p-6 space-y-4 shadow-sm transition-shadow hover:shadow-md">
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

        <div className="rounded-xl border bg-card p-6 space-y-4 shadow-sm transition-shadow hover:shadow-md">
          <h2 className="text-lg font-semibold">Features</h2>
          <p className="text-sm text-muted-foreground">
            Select at least one feature to enable for this company.
          </p>
          <div className="grid grid-cols-1 gap-3">
            {FEATURES.map((feature) => (
              <label
                key={feature.value}
                className="flex items-start gap-3 rounded-md border bg-card p-3 cursor-pointer shadow-xs transition-shadow hover:shadow-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:shadow-sm"
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

        <div className="rounded-xl border bg-card p-6 space-y-4 shadow-sm transition-shadow hover:shadow-md">
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

      <Dialog open={!!successData} onOpenChange={(open) => { if (!open) setSuccessData(null) }}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-6 text-green-600" />
              <DialogTitle>Company Created Successfully</DialogTitle>
            </div>
            <DialogDescription>
              Company <span className="font-medium text-foreground">{successData?.company.companyName}</span> has been provisioned.
              Save the administrator credentials below — the temporary password will not be shown again.
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
            <Button onClick={handleGoToCompanies} className="w-full sm:w-auto">
              Go to Companies
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
