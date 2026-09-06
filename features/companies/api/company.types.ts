export type CompanyStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED"

export type BusinessDomain = "FMCG" | "AUTOMOTIVE"

export type CompanyType =
  | "MANUFACTURER"
  | "DISTRIBUTOR"
  | "DEALER"
  | "RETAILER"
  | "SERVICE_PROVIDER"
  | "OTHER"

export type SubscriptionPlan = "TRIAL" | "BASIC" | "STANDARD" | "PROFESSIONAL" | "ENTERPRISE"

export type FinancialYear = "APR_MAR" | "JAN_DEC" | "JUL_JUN"

export type ErpSystemType = "SAP" | "ORACLE" | "DYNAMICS" | "OTHER" | "NONE"

export type PrimaryAddressRequest = {
  addressType: string
  line1: string
  line2?: string
  city: string
  state: string
  district?: string
  postalCode: string
  countryCode: string
  primary: boolean
}

export type PrimaryContactRequest = {
  name: string
  mobile: string
  email: string
}

export type CreateCompanyRequest = {
  companyCode: string
  companyName: string
  legalName?: string
  companyType: CompanyType
  businessDomain: BusinessDomain
  gstin?: string
  pan?: string
  cin?: string
  primaryAddress: PrimaryAddressRequest
  primaryContact: PrimaryContactRequest
  website?: string
  financialYear: FinancialYear
  currency: string
  timeZone: string
  subscriptionPlan: SubscriptionPlan
  erpSystem: ErpSystemType
  externalCompanyCode?: string
  enabledFeatures: string[]
}

export type CompanySummaryResponse = {
  publicId: string
  companyCode: string
  companyName: string
  legalName?: string
  status: string
  businessDomain: string
  erpSystem: ErpSystemType
  externalCompanyCode?: string
  enabledFeatures?: string[]
}

export type CreateCompanyResponse = {
  company: CompanySummaryResponse
  bootstrapAdmin: {
    username: string
    temporaryPassword: string
    mustChangePassword: boolean
  }
}

export type AddressResponse = {
  addressUuid: string
  addressType: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  countryCode: string
  isPrimary: boolean
}

export type CreateAddressRequest = {
  addressType: string
  line1: string
  line2?: string
  city: string
  state?: string
  postalCode?: string
  countryCode: string
  primary?: boolean
}

export type FeatureEntitlementRequest = {
  enabledFeatures: string[]
}

export type PageResponse<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type CompanyListParams = {
  search?: string
  query?: string
  page?: number
  size?: number
}
