import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import type { PageResponse } from "@/features/companies/api/company.types"
import type {
  PriceTypeResponse,
  ProductPriceResponse,
  ProductPriceListParams,
  CreateProductPriceRequest,
  ReviseProductPriceRequest,
  UpdateProductPriceRequest,
  DeactivateProductPriceRequest,
  ProductBatchResponse,
  CreateProductBatchRequest,
  UpdateProductBatchRequest,
  UpdateProductBatchStatusRequest,
  ProductGstMappingResponse,
  CreateProductGstMappingRequest,
  UpdateProductGstMappingRequest,
  UpdateProductGstMappingStatusRequest,
  ProductRelationshipResponse,
  CreateProductRelationshipRequest,
  UpdateProductRelationshipRequest,
  UpdateProductRelationshipStatusRequest,
  ProductFitmentResponse,
  CreateProductFitmentRequest,
  UpdateProductFitmentRequest,
  UpdateProductFitmentStatusRequest,
  ProductGeographyMappingResponse,
  CreateProductGeographyMappingRequest,
  UpdateProductGeographyMappingRequest,
  UpdateProductGeographyMappingStatusRequest,
} from "./product.types"

function resolveCompanyUuid(companyUuid: string): string {
  if (companyUuid !== "current") return companyUuid
  return useAuthStore.getState().session?.user?.companyUuid ?? companyUuid
}

function headers(companyUuid: string) {
  return { "X-Company-Context": resolveCompanyUuid(companyUuid) }
}

const productUrl = (companyUuid: string, productUuid: string) =>
  `/api/v1/companies/${resolveCompanyUuid(companyUuid)}/products/${productUuid}`

// ── Price types (company level) ──────────────────────────────────────────────

export async function getPriceTypes(companyUuid: string) {
  const resolved = resolveCompanyUuid(companyUuid)
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<PriceTypeResponse>>
  >(`/api/v1/companies/${resolved}/price-types`, {
    headers: { "X-Company-Context": resolved },
  })
  return data.data
}

// ── Prices ───────────────────────────────────────────────────────────────────

export async function getProductPrices(
  companyUuid: string,
  productUuid: string,
  params?: ProductPriceListParams
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<ProductPriceResponse>>
  >(`${productUrl(companyUuid, productUuid)}/prices`, {
    params,
    headers: headers(companyUuid),
  })
  return data.data
}

export async function getCurrentProductPrices(
  companyUuid: string,
  productUuid: string
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<ProductPriceResponse[]>
  >(`${productUrl(companyUuid, productUuid)}/prices/current`, {
    headers: headers(companyUuid),
  })
  return data.data
}

export async function getProductPrice(
  companyUuid: string,
  productUuid: string,
  priceUuid: string
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<ProductPriceResponse>
  >(`${productUrl(companyUuid, productUuid)}/prices/${priceUuid}`, {
    headers: headers(companyUuid),
  })
  return data.data
}

export async function createProductPrice(
  companyUuid: string,
  productUuid: string,
  input: CreateProductPriceRequest
) {
  const { data } = await apiClient.post<
    ApiSuccessResponse<ProductPriceResponse>
  >(`${productUrl(companyUuid, productUuid)}/prices`, input, {
    headers: headers(companyUuid),
  })
  return data.data
}

export async function reviseProductPrice(
  companyUuid: string,
  productUuid: string,
  priceUuid: string,
  input: ReviseProductPriceRequest
) {
  const { data } = await apiClient.post<
    ApiSuccessResponse<ProductPriceResponse>
  >(`${productUrl(companyUuid, productUuid)}/prices/${priceUuid}/revise`, input, {
    headers: headers(companyUuid),
  })
  return data.data
}

export async function updateProductPrice(
  companyUuid: string,
  productUuid: string,
  priceUuid: string,
  input: UpdateProductPriceRequest
) {
  const { data } = await apiClient.patch<
    ApiSuccessResponse<ProductPriceResponse>
  >(`${productUrl(companyUuid, productUuid)}/prices/${priceUuid}`, input, {
    headers: headers(companyUuid),
  })
  return data.data
}

export async function deactivateProductPrice(
  companyUuid: string,
  productUuid: string,
  priceUuid: string,
  input: DeactivateProductPriceRequest
) {
  const { data } = await apiClient.post<
    ApiSuccessResponse<ProductPriceResponse>
  >(
    `${productUrl(companyUuid, productUuid)}/prices/${priceUuid}/deactivate`,
    input,
    { headers: headers(companyUuid) }
  )
  return data.data
}

// ── Batches ──────────────────────────────────────────────────────────────────

export async function getProductBatches(
  companyUuid: string,
  productUuid: string,
  params?: ProductPriceListParams
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<ProductBatchResponse>>
  >(`${productUrl(companyUuid, productUuid)}/batches`, {
    params,
    headers: headers(companyUuid),
  })
  return data.data
}

export async function getProductBatch(
  companyUuid: string,
  productUuid: string,
  batchUuid: string
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<ProductBatchResponse>
  >(`${productUrl(companyUuid, productUuid)}/batches/${batchUuid}`, {
    headers: headers(companyUuid),
  })
  return data.data
}

export async function createProductBatch(
  companyUuid: string,
  productUuid: string,
  input: CreateProductBatchRequest
) {
  const { data } = await apiClient.post<
    ApiSuccessResponse<ProductBatchResponse>
  >(`${productUrl(companyUuid, productUuid)}/batches`, input, {
    headers: headers(companyUuid),
  })
  return data.data
}

export async function updateProductBatch(
  companyUuid: string,
  productUuid: string,
  batchUuid: string,
  input: UpdateProductBatchRequest
) {
  const { data } = await apiClient.put<
    ApiSuccessResponse<ProductBatchResponse>
  >(`${productUrl(companyUuid, productUuid)}/batches/${batchUuid}`, input, {
    headers: headers(companyUuid),
  })
  return data.data
}

export async function updateProductBatchStatus(
  companyUuid: string,
  productUuid: string,
  batchUuid: string,
  input: UpdateProductBatchStatusRequest
) {
  const { data } = await apiClient.patch<
    ApiSuccessResponse<ProductBatchResponse>
  >(`${productUrl(companyUuid, productUuid)}/batches/${batchUuid}/status`, input, {
    headers: headers(companyUuid),
  })
  return data.data
}

// ── GST mappings ─────────────────────────────────────────────────────────────

export async function getProductGstMappings(
  companyUuid: string,
  productUuid: string,
  params?: ProductPriceListParams
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<ProductGstMappingResponse>>
  >(`${productUrl(companyUuid, productUuid)}/gst-mappings`, {
    params,
    headers: headers(companyUuid),
  })
  return data.data
}

export async function createProductGstMapping(
  companyUuid: string,
  productUuid: string,
  input: CreateProductGstMappingRequest
) {
  const { data } = await apiClient.post<
    ApiSuccessResponse<ProductGstMappingResponse>
  >(`${productUrl(companyUuid, productUuid)}/gst-mappings`, input, {
    headers: headers(companyUuid),
  })
  return data.data
}

export async function updateProductGstMapping(
  companyUuid: string,
  productUuid: string,
  gstMappingUuid: string,
  input: UpdateProductGstMappingRequest
) {
  const { data } = await apiClient.put<
    ApiSuccessResponse<ProductGstMappingResponse>
  >(
    `${productUrl(companyUuid, productUuid)}/gst-mappings/${gstMappingUuid}`,
    input,
    { headers: headers(companyUuid) }
  )
  return data.data
}

export async function updateProductGstMappingStatus(
  companyUuid: string,
  productUuid: string,
  gstMappingUuid: string,
  input: UpdateProductGstMappingStatusRequest
) {
  const { data } = await apiClient.patch<
    ApiSuccessResponse<ProductGstMappingResponse>
  >(
    `${productUrl(companyUuid, productUuid)}/gst-mappings/${gstMappingUuid}/status`,
    input,
    { headers: headers(companyUuid) }
  )
  return data.data
}

// ── Relationships ────────────────────────────────────────────────────────────

export async function getProductRelationships(
  companyUuid: string,
  productUuid: string,
  params?: ProductPriceListParams
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<ProductRelationshipResponse>>
  >(`${productUrl(companyUuid, productUuid)}/relationships`, {
    params,
    headers: headers(companyUuid),
  })
  return data.data
}

export async function getProductRelationship(
  companyUuid: string,
  productUuid: string,
  relationshipUuid: string
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<ProductRelationshipResponse>
  >(
    `${productUrl(companyUuid, productUuid)}/relationships/${relationshipUuid}`,
    { headers: headers(companyUuid) }
  )
  return data.data
}

export async function createProductRelationship(
  companyUuid: string,
  productUuid: string,
  input: CreateProductRelationshipRequest
) {
  const { data } = await apiClient.post<
    ApiSuccessResponse<ProductRelationshipResponse>
  >(`${productUrl(companyUuid, productUuid)}/relationships`, input, {
    headers: headers(companyUuid),
  })
  return data.data
}

export async function updateProductRelationship(
  companyUuid: string,
  productUuid: string,
  relationshipUuid: string,
  input: UpdateProductRelationshipRequest
) {
  const { data } = await apiClient.put<
    ApiSuccessResponse<ProductRelationshipResponse>
  >(
    `${productUrl(companyUuid, productUuid)}/relationships/${relationshipUuid}`,
    input,
    { headers: headers(companyUuid) }
  )
  return data.data
}

export async function updateProductRelationshipStatus(
  companyUuid: string,
  productUuid: string,
  relationshipUuid: string,
  input: UpdateProductRelationshipStatusRequest
) {
  const { data } = await apiClient.patch<
    ApiSuccessResponse<ProductRelationshipResponse>
  >(
    `${productUrl(companyUuid, productUuid)}/relationships/${relationshipUuid}/status`,
    input,
    { headers: headers(companyUuid) }
  )
  return data.data
}

// ── Fitments ─────────────────────────────────────────────────────────────────

export async function getProductFitments(
  companyUuid: string,
  productUuid: string,
  params?: ProductPriceListParams
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<ProductFitmentResponse>>
  >(`${productUrl(companyUuid, productUuid)}/fitments`, {
    params,
    headers: headers(companyUuid),
  })
  return data.data
}

export async function createProductFitment(
  companyUuid: string,
  productUuid: string,
  input: CreateProductFitmentRequest
) {
  const { data } = await apiClient.post<
    ApiSuccessResponse<ProductFitmentResponse>
  >(`${productUrl(companyUuid, productUuid)}/fitments`, input, {
    headers: headers(companyUuid),
  })
  return data.data
}

export async function updateProductFitment(
  companyUuid: string,
  productUuid: string,
  fitmentUuid: string,
  input: UpdateProductFitmentRequest
) {
  const { data } = await apiClient.put<
    ApiSuccessResponse<ProductFitmentResponse>
  >(`${productUrl(companyUuid, productUuid)}/fitments/${fitmentUuid}`, input, {
    headers: headers(companyUuid),
  })
  return data.data
}

export async function updateProductFitmentStatus(
  companyUuid: string,
  productUuid: string,
  fitmentUuid: string,
  input: UpdateProductFitmentStatusRequest
) {
  const { data } = await apiClient.patch<
    ApiSuccessResponse<ProductFitmentResponse>
  >(
    `${productUrl(companyUuid, productUuid)}/fitments/${fitmentUuid}/status`,
    input,
    { headers: headers(companyUuid) }
  )
  return data.data
}

// ── Geography mappings ───────────────────────────────────────────────────────

export async function getProductGeographyMappings(
  companyUuid: string,
  productUuid: string,
  params?: ProductPriceListParams
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<ProductGeographyMappingResponse>>
  >(`${productUrl(companyUuid, productUuid)}/geographies`, {
    params,
    headers: headers(companyUuid),
  })
  return data.data
}

export async function createProductGeographyMapping(
  companyUuid: string,
  productUuid: string,
  input: CreateProductGeographyMappingRequest
) {
  const { data } = await apiClient.post<
    ApiSuccessResponse<ProductGeographyMappingResponse>
  >(`${productUrl(companyUuid, productUuid)}/geographies`, input, {
    headers: headers(companyUuid),
  })
  return data.data
}

export async function updateProductGeographyMapping(
  companyUuid: string,
  productUuid: string,
  geographyMappingUuid: string,
  input: UpdateProductGeographyMappingRequest
) {
  const { data } = await apiClient.put<
    ApiSuccessResponse<ProductGeographyMappingResponse>
  >(
    `${productUrl(companyUuid, productUuid)}/geographies/${geographyMappingUuid}`,
    input,
    { headers: headers(companyUuid) }
  )
  return data.data
}

export async function updateProductGeographyMappingStatus(
  companyUuid: string,
  productUuid: string,
  geographyMappingUuid: string,
  input: UpdateProductGeographyMappingStatusRequest
) {
  const { data } = await apiClient.patch<
    ApiSuccessResponse<ProductGeographyMappingResponse>
  >(
    `${productUrl(companyUuid, productUuid)}/geographies/${geographyMappingUuid}/status`,
    input,
    { headers: headers(companyUuid) }
  )
  return data.data
}
