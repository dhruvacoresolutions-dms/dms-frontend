export type ProductStatus =
  | "DRAFT"
  | "ACTIVE"
  | "INACTIVE"
  | string

export type ProductRef = {
  uuid: string
  code: string
  name: string
}

export type UomConversion = {
  uuid?: string
  uomUuid?: string
  uom?: ProductRef
  conversionFactor: number
  isDefault?: boolean
  isReportUom?: boolean
  version?: number
}

export type AutomotiveDetail = {
  brand?: ProductRef | null
  brandUuid?: string
  manufacturer?: string
  partNumber?: string
  oemPartNumber?: string
  packQuantity?: number
  grossWeight?: number
}

export type ProductResponse = {
  productUuid: string
  verticalType?: string
  code: string
  name: string
  shortName?: string
  description?: string
  productType?: string
  category?: ProductRef | null
  categoryUuid?: string
  status: ProductStatus
  barcode?: string
  baseUom?: ProductRef | null
  salesUom?: ProductRef | null
  purchaseUom?: ProductRef | null
  baseUomUuid?: string
  salesUomUuid?: string
  purchaseUomUuid?: string
  netWeight?: number
  weightUom?: string
  batchTrackingEnabled?: boolean
  automotiveDetail?: AutomotiveDetail | null
  fmcgDetail?: Record<string, unknown> | null
  uomConversions?: UomConversion[]
  attributes?: Record<string, string>
  version: number
  createdAt?: string
  updatedAt?: string
}

export type CreateProductRequest = {
  code: string
  name: string
  shortName?: string
  description?: string
  productType?: string
  categoryUuid?: string
  barcode?: string
  baseUomUuid?: string
  salesUomUuid?: string
  purchaseUomUuid?: string
  netWeight?: number
  weightUom?: string
  batchTrackingEnabled?: boolean
  automotiveDetail?: {
    brandUuid?: string
    manufacturer?: string
    partNumber?: string
    oemPartNumber?: string
    packQuantity?: number
    grossWeight?: number
  } | null
  fmcgDetail?: Record<string, unknown> | null
  uomConversions?: {
    uomUuid: string
    conversionFactor: number
    isDefault?: boolean
    isReportUom?: boolean
  }[]
  attributes?: Record<string, string>
  version?: number | null
}

export type UpdateProductRequest = Omit<CreateProductRequest, "code"> & {
  version: number
}

export type ProductLifecycleRequest = {
  version: number
}

export type ProductListParams = {
  search?: string
  query?: string
  status?: string
  categoryUuid?: string
  productType?: string
  page?: number
  size?: number
}

// ── Prices ───────────────────────────────────────────────────────────────────

export type PriceTypeResponse = {
  priceTypeUuid: string
  code: string
  name: string
  description?: string
  taxInclusive?: boolean
  requiredForPublish?: boolean
  requiredForSfaCatalog?: boolean
  displayOrder?: number
  status?: string
}

export type ProductPriceResponse = {
  priceUuid: string
  productUuid: string
  priceTypeCode: string
  priceTypeName?: string
  amount: string
  taxInclusive?: boolean
  effectiveFrom?: string
  effectiveTo?: string | null
  priceStatus?: string
  source?: string
  externalReference?: string
  batchUuid?: string | null
  version: number
  createdAt?: string
  updatedAt?: string
}

export type ProductPriceListParams = {
  page?: number
  size?: number
}

export type CreateProductPriceRequest = {
  priceTypeCode: string
  amount: string
  effectiveFrom?: string
  effectiveTo?: string | null
  batchUuid?: string | null
  externalReference?: string
}

export type ReviseProductPriceRequest = {
  amount: string
  effectiveFrom?: string
  effectiveTo?: string | null
  externalReference?: string
  version: number
}

export type UpdateProductPriceRequest = {
  externalReference?: string
  effectiveTo?: string | null
  version: number
}

export type DeactivateProductPriceRequest = {
  version: number
}

// ── Batches ──────────────────────────────────────────────────────────────────

export type ProductBatchResponse = {
  batchUuid: string
  productUuid?: string
  batchNumber: string
  manufacturingDate?: string
  expiryDate?: string | null
  status?: string
  version: number
  createdAt?: string
  updatedAt?: string
}

export type CreateProductBatchRequest = {
  batchNumber: string
  manufacturingDate?: string
  expiryDate?: string | null
}

export type UpdateProductBatchRequest = {
  manufacturingDate?: string
  expiryDate?: string | null
  version: number
}

export type UpdateProductBatchStatusRequest = {
  batchStatus: string
  version: number
}

// ── GST mappings ─────────────────────────────────────────────────────────────

export type ProductGstMappingResponse = {
  gstMappingUuid: string
  productUuid?: string
  hsnUuid?: string
  hsnCode?: string
  taxStructureUuid?: string
  taxCode?: string
  effectiveFrom?: string
  effectiveTo?: string | null
  status?: string
  version: number
  createdAt?: string
  updatedAt?: string
}

export type CreateProductGstMappingRequest = {
  hsnUuid: string
  taxStructureUuid: string
  effectiveFrom?: string
  effectiveTo?: string | null
  version?: number | null
}

export type UpdateProductGstMappingRequest = {
  hsnUuid?: string
  taxStructureUuid?: string
  effectiveFrom?: string
  effectiveTo?: string | null
  version: number
}

export type UpdateProductGstMappingStatusRequest = {
  status: string
  version: number
}

// ── Relationships ────────────────────────────────────────────────────────────

export type ProductRelationshipResponse = {
  relationshipUuid: string
  productUuid?: string
  relatedProductUuid?: string
  relatedProductCode?: string
  relatedProductName?: string
  relationshipTypeUuid?: string
  relationshipTypeCode?: string
  description?: string
  status?: string
  version: number
  createdAt?: string
  updatedAt?: string
}

export type CreateProductRelationshipRequest = {
  relatedProductUuid: string
  relationshipTypeUuid: string
  description?: string
}

export type UpdateProductRelationshipRequest = {
  description?: string
  version: number
}

export type UpdateProductRelationshipStatusRequest = {
  status: string
  version: number
}

// ── Fitments ─────────────────────────────────────────────────────────────────

export type ProductFitmentResponse = {
  fitmentUuid: string
  productUuid?: string
  variantUuid?: string
  variantName?: string
  fuelTypeUuid?: string
  fuelTypeName?: string
  engine?: string
  yearFrom?: string
  yearTo?: string | null
  fitmentPositionUuid?: string
  fitmentPositionName?: string
  status?: string
  version: number
  createdAt?: string
  updatedAt?: string
}

export type CreateProductFitmentRequest = {
  variantUuid: string
  fuelTypeUuid?: string
  engine?: string
  yearFrom?: string
  yearTo?: string | null
  fitmentPositionUuid?: string
  version?: number | null
}

export type UpdateProductFitmentRequest = {
  variantUuid?: string
  fuelTypeUuid?: string
  engine?: string
  yearFrom?: string
  yearTo?: string | null
  fitmentPositionUuid?: string
  version: number
}

export type UpdateProductFitmentStatusRequest = {
  status: string
  version: number
}

// ── Geography mappings ───────────────────────────────────────────────────────

export type ProductGeographyMappingResponse = {
  geographyMappingUuid: string
  productUuid?: string
  geographyUuid?: string
  geographyCode?: string
  geographyName?: string
  status?: string
  version: number
  createdAt?: string
  updatedAt?: string
}

export type CreateProductGeographyMappingRequest = {
  geographyUuid: string
  version?: number | null
}

export type UpdateProductGeographyMappingRequest = {
  geographyUuid: string
  version: number
}

export type UpdateProductGeographyMappingStatusRequest = {
  status: string
  version: number
}
