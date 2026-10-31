"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type FieldPath,
} from "react-hook-form"
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
  Plus,
  ShieldCheck,
  Tags,
  Store,
  Trash2,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
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
  FormSwitchField,
  FormTextField,
  requiredLabel,
} from "@/components/common/form-fields"
import { getApiError, getApiErrorMessage } from "@/lib/api/api-error"
import {
  optionalText,
  requiredName,
  requiredText,
} from "@/lib/validations/master-data"
import { GeographyCombobox } from "@/features/geographies/components/GeographyCombobox"
import { StateCombobox } from "@/components/common/StateCombobox"
import { CustomerTypeCombobox } from "./CustomerTypeCombobox"
import {
  CustomerCategoryCombobox,
  CustomerChannelCombobox,
  CustomerClassCombobox,
  CustomerLookupCombobox,
  CustomerSegmentCombobox,
  CustomerSubTypeCombobox,
} from "./CustomerMasterCombobox"
import { useCustomer } from "../hooks/use-customer"
import { useCustomerTypes } from "../hooks/use-customer-types"
import { useCreateCustomer } from "../hooks/use-create-customer"
import { useUpdateCustomer } from "../hooks/use-update-customer"
import { checkCustomerDuplicate } from "../api/customer.api"
import { useResolvePincode } from "../hooks/use-resolve-pincode"
import { useCustomerClassificationOptions } from "../hooks/use-customer-classification-options"
import {
  CUSTOMER_KYC_DOC_TYPES,
  CUSTOMER_SHOP_SIZE_MAX,
  CUSTOMER_MONTHLY_POTENTIAL_MAX,
  customerGstin,
  customerHolderName,
  customerInteger,
  customerKycNumberMessage,
  customerKycNumberPattern,
  customerMobile,
  customerPan,
  customerPincode,
  optionalAccountType,
  optionalCustomerMobile,
  optionalMoney,
  optionalVerificationRef,
  requiredMoney,
} from "../lib/customer-validation"
import {
  apiDateToPicker,
  pickerDateToApi,
  validatePersonalDates,
} from "../lib/personal-dates"
import type {
  CustomerKycDocType,
  CustomerRequest,
  CustomerResponse,
  CustomerSource,
  GstCategory,
  GstRegistrationType,
  UpdateCustomerRequest,
} from "../api/customer.types"

/**
 * Mirrors `CustomerModels.Request`:
 *  - customerType @NotNull; shopName/contactPerson @SafeName; mobile [6-9][0-9]{9}
 *  - city + state + pincode are required (state+city also feed geography)
 *  - `credit` is required on create (`creditLimit` ≥ 0, `creditDays` 0–365)
 *  - `shopSizeSqFt` / `monthlyPotential` are required JSON integers
 *  - GSTIN + GST category are required for REGISTERED and forbidden otherwise
 *  - `bank.accountType` is optional (≤30, letters/space/underscore)
 *  - `kyc[].holderFirstName`/`holderLastName` are required per entry;
 *    `kyc[].verificationRef` is optional (≤100, `[A-Za-z0-9_:.-]+`)
 *  - update ignores `credit`, `bank` and `kyc`, so those steps are create-only
 */
const customerBaseSchema = z.object({  customerType: z.string().min(1, "Customer type is required"),
  shopName: requiredName("Shop name", 150),
  contactPerson: requiredName("Contact person", 150),
  mobile: customerMobile(),
  whatsappNumber: customerMobile("WhatsApp number"),
  whatsappSameAsMobile: z.boolean(),
  alternateMobile: optionalCustomerMobile(),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .max(200, "Email must not exceed 200 characters")
    .email("Enter a valid email"),
  addressLine1: requiredText("Address line 1", 200),
  addressLine2: optionalText("Address line 2", 200),
  addressLine3: optionalText("Address line 3", 200),
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
  gstNumber: z.string().optional(),
  gstCategory: z.string().optional(),
  pan: customerPan(),
  subTypeUuid: z.string().optional(),
  channelUuid: z.string().optional(),
  segmentUuid: z.string().optional(),
  categoryUuid: z.string().optional(),
  classUuid: z.string().optional(),
  businessTypeCode: z
    .string()
    .trim()
    .min(1, "Business type is required")
    .max(50, "Business type must not exceed 50 characters"),
  shopSizeSqFt: z.string().optional(),
  monthlyPotential: z.string().optional(),
  registrationNumber: z
    .string()
    .trim()
    .max(100, "Registration number must not exceed 100 characters")
    .optional(),
  establishedYear: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^\d{4}$/.test(v),
      "Enter a four-digit year"
    ),
  brandsStocked: z.string().optional(),
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
  source: z.enum([
    "ADMIN",
    "EMPLOYEE",
    "DISTRIBUTOR",
    "SELF_REGISTRATION",
    "LOYALTY",
  ]),
  territoryUuid: z.string().optional(),
  dateOfBirth: z.string().optional(),
  anniversaryDate: z.string().optional(),
  // MECHANIC-only (required when the selected customer type is MECHANIC).
  workshopType: z.string().optional(),
  experienceYears: z.string().optional(),
  engineSpecialty: z.string().optional(),
  mechanicCount: z.string().optional(),
  // Credit terms (required on create, ignored on update).
  creditLimit: z.string().optional(),
  creditDays: z.string().optional(),
  openingBalance: z.string().optional(),
  // Bank account (optional, create only).
  bankEnabled: z.boolean(),
  bankAccountHolder: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankIfsc: z.string().optional(),
  bankBranch: z.string().optional(),
  bankAccountType: z.string().optional(),
  // KYC entries (optional, create only).
  kyc: z.array(
    z.object({
      docType: z.string().min(1, "Document type is required"),
      number: z.string().trim().min(1, "Document number is required"),
      holderFirstName: customerHolderName("Holder first name"),
      holderLastName: customerHolderName("Holder last name"),
      /** Optional third-party verification id (`verificationRef`). */
      verificationRef: optionalVerificationRef(),
    })
  ),
})

type CustomerFormValues = z.infer<typeof customerBaseSchema>

/**
 * Step-level rules that cannot be expressed on a single field.
 * `isMechanic` is passed at validation time because MECHANIC customers must
 * supply the workshop block (the backend validates and then nulls it for other
 * types).
 */
function createCustomerSchema(isEdit: boolean, isMechanic: boolean) {
  return customerBaseSchema.superRefine((values, ctx) => {
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

    if (values.gstRegistrationType === "REGISTERED") {
      const gstin = customerGstin().safeParse(values.gstNumber ?? "")
      if (!gstin.success) {
        add("gstNumber", gstin.error.issues[0]?.message ?? "Enter a valid GSTIN")
      }
      if (
        !values.gstCategory ||
        !["REGULAR", "COMPOSITION", "BOTH"].includes(values.gstCategory)
      ) {
        add("gstCategory", "GST category is required for registered customers")
      }
    } else {
      if (values.gstNumber?.trim()) {
        add("gstNumber", "GSTIN must be empty for unregistered customers")
      }
      if (values.gstCategory?.trim()) {
        add("gstCategory", "GST category must be empty for unregistered customers")
      }
    }

    if (
      values.shopTimings.openTime &&
      values.shopTimings.closeTime &&
      values.shopTimings.closeTime <= values.shopTimings.openTime
    ) {
      add("shopTimings.closeTime", "Closing time must be after opening time")
    }

    const year = values.establishedYear
    if (!year) {
      add("establishedYear", "Established year is required")
    } else if (Number(year) < 1900) {
      add("establishedYear", "Established year must be 1900 or later")
    } else if (Number(year) > new Date().getFullYear()) {
      add("establishedYear", "Established year cannot be in the future")
    }

    if ((values.latitude === undefined) !== (values.longitude === undefined)) {
      add("longitude", "Latitude and longitude must be supplied together")
    }

    const shopSize = customerInteger("Shop size", {
      max: CUSTOMER_SHOP_SIZE_MAX,
    }).safeParse(values.shopSizeSqFt ?? "")
    if (!shopSize.success) {
      add("shopSizeSqFt", shopSize.error.issues[0]?.message ?? "Invalid shop size")
    }

    const potential = customerInteger("Monthly potential", {
      max: CUSTOMER_MONTHLY_POTENTIAL_MAX,
    }).safeParse(values.monthlyPotential ?? "")
    if (!potential.success) {
      add(
        "monthlyPotential",
        potential.error.issues[0]?.message ?? "Invalid monthly potential"
      )
    }

    const brands = parseBrands(values.brandsStocked)
    if (brands && brands.length > 20) {
      add("brandsStocked", "Add at most 20 brands")
    }
    if (brands?.some((brand) => brand.length > 50)) {
      add("brandsStocked", "Each brand must not exceed 50 characters")
    }

    if (isMechanic) {
      if (!values.workshopType?.trim()) {
        add("workshopType", "Workshop type is required for mechanics")
      }
      if (!values.experienceYears?.trim()) {
        add("experienceYears", "Experience is required for mechanics")
      } else if (!/^\d+$/.test(values.experienceYears.trim())) {
        add("experienceYears", "Experience must be a whole number of years")
      }
      if (!values.engineSpecialty?.trim()) {
        add("engineSpecialty", "Engine specialty is required for mechanics")
      }
      if (!values.mechanicCount?.trim()) {
        add("mechanicCount", "Mechanic count is required for mechanics")
      } else if (!/^\d+$/.test(values.mechanicCount.trim())) {
        add("mechanicCount", "Mechanic count must be a whole number")
      }
    }

    // KYC document numbers follow the doc-type rules, and one entry is allowed
    // per document type on create.
    const seen = new Set<string>()
    values.kyc.forEach((row, index) => {
      const docType = row.docType as CustomerKycDocType
      if (!CUSTOMER_KYC_DOC_TYPES.some((t) => t.value === row.docType)) {
        add(`kyc.${index}.docType`, "Select a document type")
        return
      }
      if (seen.has(docType)) {
        add(`kyc.${index}.docType`, "Duplicate document type")
      }
      seen.add(docType)
      const number = row.number.trim().toUpperCase()
      if (number && !customerKycNumberPattern(docType).test(number)) {
        add(`kyc.${index}.number`, customerKycNumberMessage(docType))
      }
    })

    if (isEdit) return

    // Credit is mandatory on create and ignored on update.
    const limit = requiredMoney("Credit limit").safeParse(
      values.creditLimit ?? ""
    )
    if (!limit.success) {
      add("creditLimit", limit.error.issues[0]?.message ?? "Invalid credit limit")
    }
    const days = customerInteger("Credit days", { max: 365 }).safeParse(
      values.creditDays ?? ""
    )
    if (!days.success) {
      add("creditDays", days.error.issues[0]?.message ?? "Invalid credit days")
    }
    const opening = optionalMoney("Opening balance").safeParse(
      values.openingBalance ?? ""
    )
    if (!opening.success) {
      add(
        "openingBalance",
        opening.error.issues[0]?.message ?? "Invalid opening balance"
      )
    }

    if (!values.bankEnabled) return

    if (!values.bankAccountHolder?.trim()) {
      add("bankAccountHolder", "Account holder is required")
    } else if (values.bankAccountHolder.trim().length > 150) {
      add("bankAccountHolder", "Account holder must not exceed 150 characters")
    }
    if (!values.bankName?.trim()) {
      add("bankName", "Bank name is required")
    } else if (values.bankName.trim().length > 150) {
      add("bankName", "Bank name must not exceed 150 characters")
    }
    if (!values.bankAccountNumber?.trim()) {
      add("bankAccountNumber", "Account number is required")
    } else if (!/^[0-9]{9,18}$/.test(values.bankAccountNumber.trim())) {
      add("bankAccountNumber", "Account number must be 9-18 digits")
    }
    if (!values.bankIfsc?.trim()) {
      add("bankIfsc", "IFSC is required")
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(values.bankIfsc.trim())) {
      add("bankIfsc", "Enter a valid IFSC (e.g. HDFC0001234)")
    }
    if (values.bankBranch && values.bankBranch.trim().length > 150) {
      add("bankBranch", "Branch must not exceed 150 characters")
    }
    const accountType = optionalAccountType().safeParse(
      values.bankAccountType ?? ""
    )
    if (!accountType.success) {
      add(
        "bankAccountType",
        accountType.error.issues[0]?.message ?? "Invalid account type"
      )
    }
  })
}

/** "MRF, Bosch" → `["MRF", "Bosch"]` (undefined when empty). */
function parseBrands(value?: string) {
  const brands = (value ?? "")
    .split(",")
    .map((brand) => brand.trim())
    .filter(Boolean)
  return brands.length ? brands : undefined
}

function toFormDefaults(
  source: CustomerSource = "ADMIN"
): CustomerFormValues {
  return {
    customerType: "",
    shopName: "",
    contactPerson: "",
    mobile: "",
    whatsappNumber: "",
    whatsappSameAsMobile: true,
    alternateMobile: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    addressLine3: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    latitude: undefined,
    longitude: undefined,
    gstRegistrationType: "UNREGISTERED",
    gstNumber: "",
    gstCategory: "",
    pan: "",
    subTypeUuid: "",
    channelUuid: "",
    segmentUuid: "",
    categoryUuid: "",
    classUuid: "",
    businessTypeCode: "",
    shopSizeSqFt: "",
    monthlyPotential: "",
    registrationNumber: "",
    establishedYear: "",
    brandsStocked: "",
    shopTimings: { openTime: "", closeTime: "" },
    source,
    territoryUuid: "",
    dateOfBirth: "",
    anniversaryDate: "",
    workshopType: "",
    experienceYears: "",
    engineSpecialty: "",
    mechanicCount: "",
    creditLimit: "",
    creditDays: "",
    openingBalance: "",
    bankEnabled: false,
    bankAccountHolder: "",
    bankName: "",
    bankAccountNumber: "",
    bankIfsc: "",
    bankBranch: "",
    bankAccountType: "",
    kyc: [],
  }
}

function toFormValues(customer: CustomerResponse): CustomerFormValues {
  return {
    customerType: customer.customerType ?? "",
    shopName: customer.shopName ?? "",
    contactPerson: customer.contactPerson ?? "",
    mobile: customer.mobile ?? "",
    whatsappNumber: customer.whatsappNumber ?? customer.mobile ?? "",
    whatsappSameAsMobile:
      customer.whatsappSameAsMobile ??
      (!!customer.whatsappNumber &&
        customer.whatsappNumber === customer.mobile),
    alternateMobile: customer.alternateMobile ?? "",
    email: customer.email ?? "",
    addressLine1: customer.addressLine1 ?? "",
    addressLine2: customer.addressLine2 ?? "",
    addressLine3: customer.addressLine3 ?? "",
    landmark: customer.landmark ?? "",
    city: customer.city ?? "",
    state: customer.state ?? "",
    pincode: customer.pincode ?? "",
    latitude: customer.latitude ?? undefined,
    longitude: customer.longitude ?? undefined,
    gstRegistrationType: customer.gstRegistrationType ?? "UNREGISTERED",
    gstNumber: customer.gstNumber ?? customer.gstin ?? "",
    gstCategory: customer.gstCategory ?? "",
    pan: customer.pan ?? "",
    subTypeUuid: customer.subTypeUuid ?? "",
    channelUuid: customer.channelUuid ?? "",
    segmentUuid: customer.segmentUuid ?? "",
    categoryUuid: customer.categoryUuid ?? "",
    classUuid: customer.classUuid ?? "",
    businessTypeCode: customer.businessTypeCode ?? "",
    shopSizeSqFt:
      customer.shopSizeSqFt != null ? String(customer.shopSizeSqFt) : "",
    monthlyPotential:
      customer.monthlyPotential != null
        ? String(customer.monthlyPotential)
        : "",
    registrationNumber: customer.registrationNumber ?? "",
    establishedYear:
      customer.establishedYear != null ? String(customer.establishedYear) : "",
    brandsStocked: (customer.brandsStocked ?? []).join(", "),
    shopTimings: customer.shopTimings ?? { openTime: "", closeTime: "" },
    source: customer.source ?? "ADMIN",
    territoryUuid: customer.territoryUuid ?? "",
    dateOfBirth: apiDateToPicker(customer.dateOfBirth),
    anniversaryDate: apiDateToPicker(customer.anniversaryDate),
    workshopType: customer.workshopType ?? "",
    experienceYears:
      customer.experienceYears != null ? String(customer.experienceYears) : "",
    engineSpecialty: customer.engineSpecialty ?? "",
    mechanicCount:
      customer.mechanicCount != null ? String(customer.mechanicCount) : "",
    // Credit, bank and KYC are ignored by the update API — they are managed
    // from the customer detail page after creation.
    creditLimit: "",
    creditDays: "",
    openingBalance: "",
    bankEnabled: false,
    bankAccountHolder: "",
    bankName: "",
    bankAccountNumber: "",
    bankIfsc: "",
    bankBranch: "",
    bankAccountType: "",
    kyc: [],
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

const GST_CATEGORY_OPTIONS: { value: GstCategory; label: string }[] = [
  { value: "REGULAR", label: "Regular" },
  { value: "COMPOSITION", label: "Composition" },
  { value: "BOTH", label: "Both" },
]

const ENGINE_SPECIALTY_OPTIONS = [
  { value: "ELECTRICAL", label: "Electrical" },
  { value: "MECHANICAL", label: "Mechanical" },
  { value: "BOTH", label: "Both" },
]

const KYC_TYPE_OPTIONS = CUSTOMER_KYC_DOC_TYPES.map((type) => ({
  value: type.value,
  label: type.label,
}))

type StepFields = FieldPath<CustomerFormValues>[]

type CustomerStep = StepDefinition & {
  fields: StepFields
  /** Create-only (credit/bank/KYC are stripped by the update API). */
  createOnly?: boolean
}

const CUSTOMER_STEPS: CustomerStep[] = [
  {
    id: "contact",
    title: "Contact",
    description: "Outlet and contact details",
    icon: <Building2 className="size-4" />,
    fields: [
      "customerType",
      "shopName",
      "contactPerson",
      "mobile",
      "whatsappNumber",
      "whatsappSameAsMobile",
      "alternateMobile",
      "email",
      "dateOfBirth",
      "anniversaryDate",
      "source",
    ],
  },
  {
    id: "location",
    title: "Location",
    description: "Address and territory",
    icon: <MapPinned className="size-4" />,
    fields: [
      "pincode",
      "territoryUuid",
      "addressLine1",
      "addressLine2",
      "addressLine3",
      "landmark",
      "city",
      "state",
      "latitude",
      "longitude",
    ],
  },
  {
    id: "tax",
    title: "Tax",
    description: "Registration details",
    icon: <FileCheck2 className="size-4" />,
    fields: ["gstRegistrationType", "gstNumber", "gstCategory", "pan"],
  },
  {
    id: "business",
    title: "Business",
    description: "Shop profile and operating hours",
    icon: <Store className="size-4" />,
    fields: [
      "businessTypeCode",
      "shopSizeSqFt",
      "monthlyPotential",
      "establishedYear",
      "registrationNumber",
      "brandsStocked",
      "shopTimings.openTime",
      "shopTimings.closeTime",
      "workshopType",
      "experienceYears",
      "engineSpecialty",
      "mechanicCount",
    ],
  },
  {
    id: "finance",
    title: "Credit & bank",
    description: "Credit terms and settlement account",
    icon: <Wallet className="size-4" />,
    createOnly: true,
    fields: [
      "creditLimit",
      "creditDays",
      "openingBalance",
      "bankEnabled",
      "bankAccountHolder",
      "bankName",
      "bankAccountNumber",
      "bankIfsc",
      "bankBranch",
      "bankAccountType",
    ],
  },
  {
    id: "kyc",
    title: "KYC",
    description: "Identity documents and holders",
    optional: true,
    icon: <ShieldCheck className="size-4" />,
    createOnly: true,
    fields: ["kyc"],
  },
  {
    id: "classification",
    title: "Classification",
    description: "Optional business profile",
    optional: true,
    icon: <Tags className="size-4" />,
    fields: [
      "subTypeUuid",
      "channelUuid",
      "segmentUuid",
      "categoryUuid",
      "classUuid",
    ],
  },
]

/**
 * Field names the API reports that do not match the flat form names, plus
 * nested `credit.` / `bank.` paths. `kyc[i]` is normalized centrally by
 * `applyApiFieldErrors`.
 */
const API_FIELD_ALIASES: Record<string, FieldPath<CustomerFormValues>> = {
  gstin: "gstNumber",
  "credit.creditLimit": "creditLimit",
  "credit.creditDays": "creditDays",
  "credit.openingBalance": "openingBalance",
  "bank.accountHolder": "bankAccountHolder",
  "bank.accountHolderName": "bankAccountHolder",
  "bank.bankName": "bankName",
  "bank.accountNumber": "bankAccountNumber",
  "bank.ifsc": "bankIfsc",
  "bank.branch": "bankBranch",
  "bank.accountType": "bankAccountType",
}

function mapApiField(field?: string | null) {
  if (!field) return undefined
  const clean = field
    .trim()
    .replace(/^data\./, "")
    .replace(/\[(\d+)\]/g, ".$1")
  return API_FIELD_ALIASES[clean] ?? (clean as FieldPath<CustomerFormValues>)
}

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
  const { data: customerTypes } = useCustomerTypes(companyUuid)
  const createMutation = useCreateCustomer(companyUuid)
  const updateMutation = useUpdateCustomer(companyUuid)
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [errorSteps, setErrorSteps] = useState<number[]>([])

  // Two pre-built resolvers; the selected type is read at validation time
  // because customer types are fetched after the first render.
  const resolvers = useMemo(
    () => ({
      standard: zodResolver(createCustomerSchema(isEdit, false)),
      mechanic: zodResolver(createCustomerSchema(isEdit, true)),
    }),
    [isEdit]
  )

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    setFocus,
    trigger,
  } = useForm<CustomerFormValues>({
    resolver: (values, context, options) => {
      const isMechanic =
        customerTypes?.find((type) => type.uuid === values.customerType)
          ?.code === "MECHANIC"
      return (isMechanic ? resolvers.mechanic : resolvers.standard)(
        values,
        context,
        options
      )
    },
    defaultValues: toFormDefaults(),
  })

  const { fields: kycFields, append: appendKyc, remove: removeKyc } =
    useFieldArray({ control, name: "kyc" })

  const customerTypeUuid = useWatch({ control, name: "customerType" })
  const pincode = useWatch({ control, name: "pincode" })
  const territoryUuid = useWatch({ control, name: "territoryUuid" })
  const gstRegistrationType = useWatch({
    control,
    name: "gstRegistrationType",
  })
  const mobile = useWatch({ control, name: "mobile" })
  const whatsappSameAsMobile = useWatch({
    control,
    name: "whatsappSameAsMobile",
  })
  const bankEnabled = useWatch({ control, name: "bankEnabled" })
  const kycRows = useWatch({ control, name: "kyc" })

  const selectedType = useMemo(
    () => customerTypes?.find((type) => type.uuid === customerTypeUuid),
    [customerTypes, customerTypeUuid]
  )
  const customerTypeCode = selectedType?.code ?? ""
  const isMechanicType = customerTypeCode === "MECHANIC"

  const steps = useMemo(
    () => CUSTOMER_STEPS.filter((step) => !(isEdit && step.createOnly)),
    [isEdit]
  )

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
    // A new customer type invalidates every classification selection and the
    // mechanic-only block (the backend nulls it for other types).
    lastCustomerType.current = customerTypeUuid ?? ""
    setValue("subTypeUuid", "", { shouldValidate: false })
    setValue("channelUuid", "", { shouldValidate: false })
    setValue("segmentUuid", "", { shouldValidate: false })
    setValue("categoryUuid", "", { shouldValidate: false })
    setValue("classUuid", "", { shouldValidate: false })
    setValue("workshopType", "", { shouldValidate: false })
    setValue("experienceYears", "", { shouldValidate: false })
    setValue("engineSpecialty", "", { shouldValidate: false })
    setValue("mechanicCount", "", { shouldValidate: false })
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
      setValue("gstNumber", "", { shouldValidate: false })
      setValue("gstCategory", "", { shouldValidate: false })
    }
  }, [gstRegistrationType, setValue])

  // "WhatsApp same as mobile" mirrors the primary number.
  useEffect(() => {
    if (!whatsappSameAsMobile) return
    setValue("whatsappNumber", mobile ?? "", { shouldValidate: false })
  }, [whatsappSameAsMobile, mobile, setValue])

  const leaveForm = () => {
    router.push(
      isEdit && customerUuid ? `/customers/${customerUuid}` : "/customers"
    )
  }

  const goToNextStep = async () => {
    const step = steps[currentStep]
    const isValid = await trigger(step.fields)
    if (!isValid) {
      setErrorSteps((steps) =>
        steps.includes(currentStep) ? steps : [...steps, currentStep]
      )
      return
    }
    setErrorSteps((steps) => steps.filter((item) => item !== currentStep))
    setCurrentStep((stepIndex) => Math.min(stepIndex + 1, steps.length - 1))
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    })
  }

  const stepIndexForField = (field?: string | null) => {
    if (!field) return -1
    return steps.findIndex((step) =>
      step.fields.some(
        (name) => field === name || field.startsWith(`${name}.`)
      )
    )
  }

  const goToFieldStep = (field?: string | null) => {
    if (!field) return
    const stepIndex = stepIndexForField(field)
    if (stepIndex < 0) return
    setErrorSteps((items) =>
      items.includes(stepIndex) ? items : [...items, stepIndex]
    )
    setCurrentStep(stepIndex)
    window.requestAnimationFrame(() =>
      setFocus(field as FieldPath<CustomerFormValues>)
    )
  }

  const handleInvalid = (
    errors: Partial<Record<keyof CustomerFormValues, unknown>>
  ) => {
    const firstField = Object.keys(errors)[0]
    if (!firstField) return
    const stepIndex = stepIndexForField(firstField)
    if (stepIndex >= 0) {
      setErrorSteps((items) =>
        items.includes(stepIndex) ? items : [...items, stepIndex]
      )
      setCurrentStep(stepIndex)
      window.requestAnimationFrame(() =>
        setFocus(firstField as FieldPath<CustomerFormValues>)
      )
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

    const registered = values.gstRegistrationType === "REGISTERED"
    const mechanic = isMechanicType

    const payload: CustomerRequest = {
      customerType: values.customerType,
      shopName: values.shopName.trim(),
      contactPerson: values.contactPerson.trim(),
      mobile: values.mobile.trim(),
      alternateMobile: orUndefined(values.alternateMobile),
      email: values.email.trim(),
      addressLine1: values.addressLine1.trim(),
      addressLine2: orUndefined(values.addressLine2),
      addressLine3: orUndefined(values.addressLine3),
      landmark: orUndefined(values.landmark),
      city: values.city.trim(),
      state: values.state.trim(),
      pincode: values.pincode.trim(),
      latitude: values.latitude,
      longitude: values.longitude,
      gstRegistrationType: values.gstRegistrationType,
      gstNumber: registered
        ? values.gstNumber?.trim().toUpperCase()
        : undefined,
      gstCategory: registered
        ? (values.gstCategory as GstCategory)
        : undefined,
      pan: values.pan?.trim() ? values.pan.trim().toUpperCase() : undefined,
      subTypeUuid: orUndefined(values.subTypeUuid),
      channelUuid: orUndefined(values.channelUuid),
      segmentUuid: orUndefined(values.segmentUuid),
      categoryUuid: orUndefined(values.categoryUuid),
      classUuid: orUndefined(values.classUuid),
      businessTypeCode: values.businessTypeCode,
      shopSizeSqFt: Number(values.shopSizeSqFt),
      monthlyPotential: Number(values.monthlyPotential),
      whatsappNumber: values.whatsappSameAsMobile
        ? values.mobile.trim()
        : values.whatsappNumber.trim(),
      whatsappSameAsMobile: values.whatsappSameAsMobile,
      registrationNumber: orUndefined(values.registrationNumber),
      establishedYear: Number(values.establishedYear),
      brandsStocked: parseBrands(values.brandsStocked),
      shopTimings: {
        openTime: values.shopTimings.openTime,
        closeTime: values.shopTimings.closeTime,
      },
      source: values.source,
      territoryUuid: territoryToSend,
      dateOfBirth: pickerDateToApi(values.dateOfBirth),
      anniversaryDate: pickerDateToApi(values.anniversaryDate),
      workshopType: mechanic ? orUndefined(values.workshopType) : undefined,
      experienceYears:
        mechanic && values.experienceYears?.trim()
          ? Number(values.experienceYears)
          : undefined,
      engineSpecialty: mechanic
        ? orUndefined(values.engineSpecialty)
        : undefined,
      mechanicCount:
        mechanic && values.mechanicCount?.trim()
          ? Number(values.mechanicCount)
          : undefined,
      // Required on create; the update API strips it.
      credit: {
        creditLimit: Number(values.creditLimit),
        creditDays: Number(values.creditDays),
        openingBalance: values.openingBalance?.trim()
          ? Number(values.openingBalance)
          : undefined,
      },
      bank:
        values.bankEnabled && values.bankAccountNumber?.trim()
          ? {
              accountHolder: values.bankAccountHolder?.trim() ?? "",
              bankName: values.bankName?.trim() ?? "",
              accountNumber: values.bankAccountNumber.trim(),
              ifsc: values.bankIfsc?.trim().toUpperCase() ?? "",
              branch: orUndefined(values.bankBranch),
              accountType: orUndefined(values.bankAccountType),
              // JSON create cannot attach a BANK_PROOF document; upload the
              // proof as a bank entry from the customer page afterwards.
              proofClientRef: undefined,
            }
          : undefined,
      kyc: values.kyc.length
        ? values.kyc.map((row) => ({
            docType: row.docType as CustomerKycDocType,
            number: row.number.trim().toUpperCase(),
            holderFirstName: row.holderFirstName.trim(),
            holderLastName: row.holderLastName.trim(),
            verificationRef: orUndefined(row.verificationRef),
          }))
        : undefined,
    }

    const onError = (mutationError: unknown) => {
      const apiError = getApiError(mutationError)

      // The API reports field errors under its own names (`gstNumber`,
      // `credit.creditLimit`, `kyc[0].holderFirstName`, `bank.ifsc`,
      // `data.*` on with-files). Map them onto the form fields.
      for (const detail of apiError?.errors ?? []) {
        const field = mapApiField(detail.field)
        if (!field) continue
        setError(field, { type: "server", message: detail.message })
      }

      goToFieldStep(mapApiField(apiError?.errors?.[0]?.field))

      // A stale row version (or a customer that left DRAFT/REWORK) is
      // recoverable: pull the latest row so the next submit uses a fresh
      // version. User input is preserved because hydration is keyed by uuid.
      if (
        apiError?.code === "OPTIMISTIC_LOCK_CONFLICT" ||
        apiError?.code === "CUSTOMER_NOT_EDITABLE"
      ) {
        void refetchCustomer()
      }
      toast.error(getApiErrorMessage(mutationError, "Failed to save customer"))
    }

    // Pre-flight the uniqueness rules the API enforces on create/update, so the
    // user sees the clash on the offending field instead of a failed submit.
    setIsCheckingDuplicate(true)
    const probe = await checkCustomerDuplicate(companyUuid, {
      mobile: payload.mobile,
      gstin: registered ? payload.gstNumber : undefined,
      excludeUuid: customerUuid ?? undefined,
    }).catch(() => null)
    setIsCheckingDuplicate(false)
    if (probe?.duplicate) {
      const field = probe.field === "gstin" ? "gstNumber" : "mobile"
      const label = field === "gstNumber" ? "GSTIN" : "Mobile number"
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
      // `credit`, `bank` and `kyc` are stripped by the update API.
      const { credit, bank, kyc, ...editable } = payload
      void credit
      void bank
      void kyc
      const input: UpdateCustomerRequest = {
        ...editable,
        version: customer.version,
      }
      updateMutation.mutate(
        { customerUuid, input },
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
        const extras = [
          created.hasCredit ? "credit terms" : null,
          created.bankEntries?.length ? "bank account" : null,
          created.kycEntries?.length ? "KYC entries" : null,
        ].filter(Boolean)
        toast.success(
          created.lifecycleStatus === "ACTIVE"
            ? "Customer created and activated"
            : "Customer created as draft",
          extras.length
            ? { description: `Added ${extras.join(", ")}.` }
            : undefined
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
  const step = steps[currentStep]
  const isLastStep = currentStep >= steps.length - 1

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
        onKeyDown={(event) => {
          // Step forms must never auto-submit on Enter inside an input; submission
          // only happens through the explicit submit button.
          if (event.key !== "Enter") return
          const target = event.target as HTMLElement | null
          if (!target) return
          if (target.tagName === "TEXTAREA") return
          if (target.tagName === "BUTTON") return
          if (target.getAttribute("aria-expanded") === "true") return
          event.preventDefault()
        }}
        className="flex w-full flex-1 flex-col"
        noValidate
      >
        <div className="py-2">
          <Stepper
            steps={steps}
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

          {step?.id === "contact" ? (
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
                  <FormSwitchField
                    control={control}
                    name="whatsappSameAsMobile"
                    label="WhatsApp"
                    hint="Same as mobile number"
                  />
                  <FormTextField
                    control={control}
                    name="whatsappNumber"
                    label={requiredLabel("WhatsApp Number")}
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    disabled={whatsappSameAsMobile}
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

          {step?.id === "location" ? (
            <section className="animate-in space-y-6 duration-200 fade-in-50">
              <div className="space-y-1.5 border-b pb-5">
                <h2 className="text-[15px] font-semibold tracking-tight">
                  Location &amp; territory
                </h2>
                <p className="text-sm text-muted-foreground">
                  City and state are required. They also resolve the territory
                  when the pincode has no mapping.
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
                    name="addressLine3"
                    label="Address Line 3"
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

          {step?.id === "tax" ? (
            <section className="animate-in space-y-6 duration-200 fade-in-50">
              <div className="space-y-1.5 border-b pb-5">
                <h2 className="text-[15px] font-semibold tracking-tight">
                  Tax &amp; compliance
                </h2>
                <p className="text-sm text-muted-foreground">
                  Registered customers need a GSTIN and a GST category.
                  Unregistered customers must leave both empty.
                </p>
              </div>
              <FieldGroup>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <FormSelectField
                    control={control}
                    name="gstRegistrationType"
                    label={requiredLabel("GST Registration")}
                    options={GST_REGISTRATION_OPTIONS}
                  />
                  {gstRegistrationType === "REGISTERED" ? (
                    <>
                      <FormTextField
                        control={control}
                        name="gstNumber"
                        label={requiredLabel("GSTIN")}
                        maxLength={15}
                        placeholder="29ABCDE1234F1Z5"
                      />
                      <FormSelectField
                        control={control}
                        name="gstCategory"
                        label={requiredLabel("GST Category")}
                        options={GST_CATEGORY_OPTIONS}
                        placeholder="Select GST category..."
                      />
                    </>
                  ) : null}
                  <FormTextField
                    control={control}
                    name="pan"
                    label="PAN"
                    maxLength={10}
                    placeholder="ABCDE1234F"
                  />
                </div>
              </FieldGroup>
            </section>
          ) : null}

          {step?.id === "business" ? (
            <section className="animate-in space-y-6 duration-200 fade-in-50">
              <div className="space-y-1.5 border-b pb-5">
                <h2 className="text-[15px] font-semibold tracking-tight">
                  Business profile
                </h2>
                <p className="text-sm text-muted-foreground">
                  Shop size and monthly potential are recorded as whole numbers
                  (sq ft and ₹).
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
                  <FormNumberField
                    control={control}
                    name="shopSizeSqFt"
                    label={requiredLabel("Shop Size (sq ft)")}
                    step="1"
                    min={0}
                    max={CUSTOMER_SHOP_SIZE_MAX}
                    emptyValue=""
                  />
                  <FormNumberField
                    control={control}
                    name="monthlyPotential"
                    label={requiredLabel("Monthly Potential (₹)")}
                    step="1"
                    min={0}
                    max={CUSTOMER_MONTHLY_POTENTIAL_MAX}
                    emptyValue=""
                  />
                  <FormTextField
                    control={control}
                    name="establishedYear"
                    label={requiredLabel("Established Year")}
                    type="number"
                    maxLength={4}
                    placeholder="e.g. 2015"
                  />
                  <FormTextField
                    control={control}
                    name="registrationNumber"
                    label="Registration Number"
                    maxLength={100}
                    placeholder="e.g. KA-2015-00421"
                  />
                  <FormTextField
                    control={control}
                    name="brandsStocked"
                    label="Brands Stocked"
                    placeholder="MRF, Bosch, Exide"
                  />
                  <div className="lg:col-span-3">
                    <Field>
                      <FieldDescription>
                        Up to 20 brands, separated by commas (1–50 characters
                        each).
                      </FieldDescription>
                    </Field>
                  </div>
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

              {isMechanicType ? (
                <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                  <div>
                    <h3 className="text-sm font-semibold">Workshop details</h3>
                    <p className="text-sm text-muted-foreground">
                      Required for mechanic customers.
                    </p>
                  </div>
                  <FieldGroup>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                      <FormComboboxField
                        control={control}
                        name="workshopType"
                        label={requiredLabel("Workshop Type")}
                        companyUuid={companyUuid}
                        Combobox={CustomerLookupCombobox}
                        comboboxProps={{ lookupType: "WORKSHOP_TYPE" }}
                      />
                      <FormNumberField
                        control={control}
                        name="experienceYears"
                        label={requiredLabel("Experience (years)")}
                        step="1"
                        min={0}
                        emptyValue=""
                      />
                      <FormSelectField
                        control={control}
                        name="engineSpecialty"
                        label={requiredLabel("Engine Specialty")}
                        options={ENGINE_SPECIALTY_OPTIONS}
                        placeholder="Select specialty..."
                      />
                      <FormNumberField
                        control={control}
                        name="mechanicCount"
                        label={requiredLabel("Mechanics")}
                        step="1"
                        min={0}
                        emptyValue=""
                      />
                    </div>
                  </FieldGroup>
                </div>
              ) : null}
            </section>
          ) : null}

          {step?.id === "finance" ? (
            <section className="animate-in space-y-6 duration-200 fade-in-50">
              <div className="space-y-1.5 border-b pb-5">
                <h2 className="text-[15px] font-semibold tracking-tight">
                  Credit &amp; bank
                </h2>
                <p className="text-sm text-muted-foreground">
                  Credit terms are mandatory when a customer is created. Bank
                  details are optional and start as a pending entry.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Credit terms</h3>
                <FieldGroup>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <FormNumberField
                      control={control}
                      name="creditLimit"
                      label={requiredLabel("Credit Limit (₹)")}
                      step="0.01"
                      min={0}
                      emptyValue=""
                    />
                    <FormNumberField
                      control={control}
                      name="creditDays"
                      label={requiredLabel("Credit Days")}
                      step="1"
                      min={0}
                      max={365}
                      emptyValue=""
                    />
                    <FormNumberField
                      control={control}
                      name="openingBalance"
                      label="Opening Balance (₹)"
                      step="0.01"
                      emptyValue=""
                    />
                  </div>
                </FieldGroup>
                <FieldDescription>
                  Credit days must be between 0 and 365. A negative opening
                  balance records an advance.
                </FieldDescription>
              </div>

              <div className="space-y-4 border-t pt-5">
                <FormSwitchField
                  control={control}
                  name="bankEnabled"
                  label="Bank account"
                  hint="Add settlement account details now"
                />
                {bankEnabled ? (
                  <>
                    <FieldGroup>
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <FormTextField
                          control={control}
                          name="bankAccountHolder"
                          label={requiredLabel("Account Holder")}
                          maxLength={150}
                        />
                        <FormTextField
                          control={control}
                          name="bankName"
                          label={requiredLabel("Bank Name")}
                          maxLength={150}
                        />
                        <FormTextField
                          control={control}
                          name="bankAccountNumber"
                          label={requiredLabel("Account Number")}
                          maxLength={18}
                          placeholder="9–18 digits"
                          autoComplete="off"
                        />
                        <FormTextField
                          control={control}
                          name="bankIfsc"
                          label={requiredLabel("IFSC")}
                          maxLength={11}
                          placeholder="HDFC0001234"
                        />
                        <FormTextField
                          control={control}
                          name="bankBranch"
                          label="Branch"
                          maxLength={150}
                        />
                        <FormTextField
                          control={control}
                          name="bankAccountType"
                          label="Account Type"
                          maxLength={30}
                          placeholder="CURRENT ACCOUNT"
                        />
                      </div>
                    </FieldGroup>
                    <FieldDescription>
                      Letters, spaces and underscores only (max 30 characters).
                      A bank proof document can be attached from the customer
                      page after creation.
                    </FieldDescription>
                  </>
                ) : null}
              </div>
            </section>
          ) : null}

          {step?.id === "kyc" ? (
            <section className="animate-in space-y-6 duration-200 fade-in-50">
              <div className="space-y-1.5 border-b pb-5">
                <h2 className="text-[15px] font-semibold tracking-tight">
                  KYC documents{" "}
                  <span className="font-normal text-muted-foreground">
                    (Optional)
                  </span>
                </h2>
                <p className="text-sm text-muted-foreground">
                  Each document needs the holder&apos;s first and last name. One
                  entry per document type; a reviewer verifies it afterwards.
                  Add the vendor verification reference when the document was
                  already verified in the app.
                </p>
              </div>

              {kycFields.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <ShieldCheck className="mx-auto size-6 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No KYC documents added yet. You can add them now or later
                    from the customer page.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {kycFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="rounded-lg border bg-muted/20 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <h3 className="text-sm font-medium">
                          Document {index + 1}
                        </h3>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeKyc(index)}
                          aria-label={`Remove document ${index + 1}`}
                        >
                          <Trash2 className="size-4" />
                          Remove
                        </Button>
                      </div>
                      <FieldGroup>
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                          <FormSelectField
                            control={control}
                            name={`kyc.${index}.docType`}
                            label={requiredLabel("Document Type")}
                            options={KYC_TYPE_OPTIONS}
                            placeholder="Select document type..."
                          />
                          <FormTextField
                            control={control}
                            name={`kyc.${index}.number`}
                            label={requiredLabel("Document Number")}
                            maxLength={20}
                            placeholder={
                              CUSTOMER_KYC_DOC_TYPES.find(
                                (type) =>
                                  type.value === kycRows?.[index]?.docType
                              )?.placeholder ?? "Document number"
                            }
                            autoComplete="off"
                          />
                          <FormTextField
                            control={control}
                            name={`kyc.${index}.holderFirstName`}
                            label={requiredLabel("Holder First Name")}
                            maxLength={100}
                          />
                          <FormTextField
                            control={control}
                            name={`kyc.${index}.holderLastName`}
                            label={requiredLabel("Holder Last Name")}
                            maxLength={100}
                          />
                          <FormTextField
                            control={control}
                            name={`kyc.${index}.verificationRef`}
                            label="Verification Reference"
                            maxLength={100}
                            placeholder="e.g. ver_91c2 (optional)"
                          />
                        </div>
                      </FieldGroup>
                    </div>
                  ))}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  appendKyc({
                    docType: "",
                    number: "",
                    holderFirstName: "",
                    holderLastName: "",
                    verificationRef: "",
                  })
                }
                disabled={kycFields.length >= CUSTOMER_KYC_DOC_TYPES.length}
              >
                <Plus className="size-4" />
                Add document
              </Button>
            </section>
          ) : null}

          {step?.id === "classification" ? (
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
                onClick={() => setCurrentStep((index) => index - 1)}
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
              Step {currentStep + 1} of {steps.length}
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
            {!isLastStep ? (
              <Button
                type="button"
                onClick={() => void goToNextStep()}
                disabled={isPending || isCheckingDuplicate}
              >
                {step?.id === "finance"
                  ? "Continue to KYC"
                  : step?.id === "kyc"
                    ? "Continue to optional details"
                    : "Next"}
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
          Select a territory manually — city and state still resolve the
          territory when possible.
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
