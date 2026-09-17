import { Building2, MapPin, Settings2, type LucideIcon } from "lucide-react"

export const COMPANY_TYPE_OPTIONS = [
  { value: "MANUFACTURER", label: "Manufacturer" },
  { value: "DISTRIBUTOR", label: "Distributor" },
] as const

export type CompanyCreateStep = {
  id: string
  title: string
  description: string
  icon: LucideIcon
}

export const COMPANY_CREATE_STEPS: CompanyCreateStep[] = [
  {
    id: "company-info",
    title: "Company Information",
    description: "Basic business details",
    icon: Building2,
  },
  {
    id: "company-address",
    title: "Company Address",
    description: "Primary registered address",
    icon: MapPin,
  },
  {
    id: "rest-info",
    title: "Rest Information",
    description: "Contact & configuration",
    icon: Settings2,
  },
]

export const COMPANY_FEATURES = [
  { value: "DMS_CORE", label: "DMS Core", description: "Core document management capabilities" },
  { value: "GEOGRAPHY_MANAGEMENT", label: "Geography Management", description: "Geography administration capabilities" },
] as const

export const COMPANY_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SUSPENDED", label: "Suspended" },
] as const

export type CompanyStatusOption =
  (typeof COMPANY_STATUS_OPTIONS)[number]
