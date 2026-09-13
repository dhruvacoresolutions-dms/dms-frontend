import { z } from "zod"

// Flattened form schema, transformed to API payload on submit
export const companySchema = z.object({
  // Step 1 - Company Information
  companyCode: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(40, "Code must not exceed 40 characters")
    .regex(/^[A-Za-z0-9_-]+$/, "Code must contain only letters, numbers, hyphens, or underscores"),
  companyName: z.string().min(1, "Company name is required").max(120, "Company name is too long"),
  legalName: z.string().max(200, "Legal name is too long").optional().or(z.literal("")),
  companyType: z.enum(["MANUFACTURER", "DISTRIBUTOR"], {
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

export type CompanyFormValues = z.infer<typeof companySchema>

export const STEP_FIELDS: Record<number, (keyof CompanyFormValues)[]> = {
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
