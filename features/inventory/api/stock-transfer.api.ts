import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import type { PageResponse } from "@/features/companies/api/company.types"
import { companyHeaders, distributorBase } from "./inventory-utils"
import type {
  CreateStockTransferRequest,
  StockDecisionRequest,
  StockDocument,
  StockTransferListParams,
} from "./inventory.types"

const transferBase = (companyUuid: string, distributorUuid: string) =>
  `${distributorBase(companyUuid, distributorUuid)}/stock-transfers`

export async function getStockTransfers(
  companyUuid: string,
  distributorUuid: string,
  params?: StockTransferListParams
) {
  // The transfer endpoint names the free-text filter `q` (adjustments accept
  // both `search` and `q`).
  const query = params
    ? { ...params, q: params.search, search: undefined }
    : params
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<StockDocument>>
  >(transferBase(companyUuid, distributorUuid), {
    params: query,
    headers: companyHeaders(companyUuid),
  })
  return data.data
}

export async function getStockTransfer(
  companyUuid: string,
  distributorUuid: string,
  documentUuid: string
) {
  const { data } = await apiClient.get<ApiSuccessResponse<StockDocument>>(
    `${transferBase(companyUuid, distributorUuid)}/${documentUuid}`,
    { headers: companyHeaders(companyUuid) }
  )
  return data.data
}

export async function createStockTransfer(
  companyUuid: string,
  distributorUuid: string,
  input: CreateStockTransferRequest
) {
  const { data } = await apiClient.post<ApiSuccessResponse<StockDocument>>(
    transferBase(companyUuid, distributorUuid),
    input,
    { headers: companyHeaders(companyUuid) }
  )
  return data.data
}

export async function approveStockTransfer(
  companyUuid: string,
  distributorUuid: string,
  documentUuid: string,
  input: StockDecisionRequest
) {
  const { data } = await apiClient.post<ApiSuccessResponse<StockDocument>>(
    `${transferBase(companyUuid, distributorUuid)}/${documentUuid}/approve`,
    input,
    { headers: companyHeaders(companyUuid) }
  )
  return data.data
}

export async function rejectStockTransfer(
  companyUuid: string,
  distributorUuid: string,
  documentUuid: string,
  input: StockDecisionRequest
) {
  const { data } = await apiClient.post<ApiSuccessResponse<StockDocument>>(
    `${transferBase(companyUuid, distributorUuid)}/${documentUuid}/reject`,
    input,
    { headers: companyHeaders(companyUuid) }
  )
  return data.data
}
