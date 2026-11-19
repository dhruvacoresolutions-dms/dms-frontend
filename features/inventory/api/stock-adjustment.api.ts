import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import type { PageResponse } from "@/features/companies/api/company.types"
import { companyHeaders, distributorBase } from "./inventory-utils"
import type {
  CreateStockAdjustmentRequest,
  StockAdjustmentListParams,
  StockDocument,
  StockDecisionRequest,
} from "./inventory.types"

const adjustmentBase = (companyUuid: string, distributorUuid: string) =>
  `${distributorBase(companyUuid, distributorUuid)}/stock-adjustments`

export async function getStockAdjustments(
  companyUuid: string,
  distributorUuid: string,
  params?: StockAdjustmentListParams
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<StockDocument>>
  >(adjustmentBase(companyUuid, distributorUuid), {
    params,
    headers: companyHeaders(companyUuid),
  })
  return data.data
}

export async function getStockAdjustment(
  companyUuid: string,
  distributorUuid: string,
  documentUuid: string
) {
  const { data } = await apiClient.get<ApiSuccessResponse<StockDocument>>(
    `${adjustmentBase(companyUuid, distributorUuid)}/${documentUuid}`,
    { headers: companyHeaders(companyUuid) }
  )
  return data.data
}

export async function createStockAdjustment(
  companyUuid: string,
  distributorUuid: string,
  input: CreateStockAdjustmentRequest
) {
  const { data } = await apiClient.post<ApiSuccessResponse<StockDocument>>(
    adjustmentBase(companyUuid, distributorUuid),
    input,
    { headers: companyHeaders(companyUuid) }
  )
  return data.data
}

/** Legacy approve route (remarks optional). */
export async function approveStockAdjustment(
  companyUuid: string,
  distributorUuid: string,
  documentUuid: string,
  input: StockDecisionRequest
) {
  const { data } = await apiClient.post<ApiSuccessResponse<StockDocument>>(
    `${adjustmentBase(companyUuid, distributorUuid)}/${documentUuid}/approve`,
    input,
    { headers: companyHeaders(companyUuid) }
  )
  return data.data
}

/** Reviewed approval — remarks are required by the backend. */
export async function reviewApproveStockAdjustment(
  companyUuid: string,
  distributorUuid: string,
  documentUuid: string,
  input: StockDecisionRequest
) {
  const { data } = await apiClient.post<ApiSuccessResponse<StockDocument>>(
    `${adjustmentBase(companyUuid, distributorUuid)}/${documentUuid}/approval`,
    input,
    { headers: companyHeaders(companyUuid) }
  )
  return data.data
}

export async function rejectStockAdjustment(
  companyUuid: string,
  distributorUuid: string,
  documentUuid: string,
  input: StockDecisionRequest
) {
  const { data } = await apiClient.post<ApiSuccessResponse<StockDocument>>(
    `${adjustmentBase(companyUuid, distributorUuid)}/${documentUuid}/reject`,
    input,
    { headers: companyHeaders(companyUuid) }
  )
  return data.data
}

export async function exportStockAdjustments(
  companyUuid: string,
  distributorUuid: string,
  format: "csv" | "xlsx",
  filters?: Omit<StockAdjustmentListParams, "page" | "size">
) {
  const { data } = await apiClient.get<Blob>(
    `${adjustmentBase(companyUuid, distributorUuid)}/export`,
    {
      headers: companyHeaders(companyUuid),
      params: { format, ...filters },
      responseType: "blob",
      timeout: 60_000,
    }
  )
  return data
}

export async function getStockAdjustmentReasons(
  companyUuid: string,
  distributorUuid: string
) {
  const { data } = await apiClient.get<ApiSuccessResponse<string[]>>(
    `${distributorBase(companyUuid, distributorUuid)}/stock-adjustment-reasons`,
    { headers: companyHeaders(companyUuid) }
  )
  return data.data
}
