import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import type { PageResponse } from "@/features/companies/api/company.types"
import { companyHeaders, distributorBase } from "./inventory-utils"
import type {
  AvailableQuantityParams,
  ScopedProduct,
  ScopedProductSearchParams,
  StockSummaryParams,
  StockSummaryRow,
  StockTypeOption,
} from "./inventory.types"

const summaryBase = (companyUuid: string, distributorUuid: string) =>
  `${distributorBase(companyUuid, distributorUuid)}/stock-summary`

export async function getStockSummary(
  companyUuid: string,
  distributorUuid: string,
  params?: StockSummaryParams
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<StockSummaryRow>>
  >(summaryBase(companyUuid, distributorUuid), {
    params,
    headers: companyHeaders(companyUuid),
  })
  return data.data
}

export async function getAvailableQuantity(
  companyUuid: string,
  distributorUuid: string,
  params: AvailableQuantityParams
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{ quantity: number }>
  >(`${summaryBase(companyUuid, distributorUuid)}/available-quantity`, {
    params,
    headers: companyHeaders(companyUuid),
  })
  return data.data
}

export async function searchScopedProducts(
  companyUuid: string,
  distributorUuid: string,
  params: ScopedProductSearchParams
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<ScopedProduct>>
  >(`${summaryBase(companyUuid, distributorUuid)}/products`, {
    params: {
      godown: params.godown,
      search: params.search || undefined,
      searchBy: params.searchBy ?? "ALL",
      page: params.page ?? 0,
      size: params.size ?? 20,
    },
    headers: companyHeaders(companyUuid),
  })
  return data.data
}

export async function getStockTypes(
  companyUuid: string,
  distributorUuid: string
) {
  const { data } = await apiClient.get<ApiSuccessResponse<StockTypeOption[]>>(
    `${distributorBase(companyUuid, distributorUuid)}/stock-types`,
    { headers: companyHeaders(companyUuid) }
  )
  return data.data
}
