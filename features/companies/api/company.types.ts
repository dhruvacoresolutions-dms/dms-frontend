export type CompanyStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED"

export type BusinessDomain = "FMCG" | "AUTOMOTIVE"

export type ErpSystemType = "SAP" | "ORACLE" | "DYNAMICS" | "OTHER" | "NONE"

export type CreateCompanyRequest = {
  companyCode: string
  companyName: string
  legalName?: string
  businessDomain: BusinessDomain
  erpSystem: ErpSystemType
  externalCompanyCode?: string
  enabledFeatures: string[]
  primaryAddress: {
    addressType: string
    line1: string
    line2?: string
    city: string
    state?: string
    postalCode?: string
    countryCode: string
    primary: boolean
  }
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
  features: string[]
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
  page?: number
  size?: number
}
