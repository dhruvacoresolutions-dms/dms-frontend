import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import type { PageResponse } from "@/features/companies/api/company.types"
import { companyBase, companyHeaders } from "./inventory-utils"
import type {
  StockImportHistoryItem,
  StockImportHistoryParams,
  StockImportJobDetail,
  StockImportUploadResponse,
} from "./inventory.types"

const importBase = (companyUuid: string) =>
  `${companyBase(companyUuid)}/stock-adjustments`

export async function getStockAdjustmentImportTemplate(
  companyUuid: string,
  format: "csv" | "xlsx" = "csv"
) {
  const { data } = await apiClient.get<Blob>(
    `${importBase(companyUuid)}/import/template`,
    {
      headers: companyHeaders(companyUuid),
      params: { format },
      responseType: "blob",
    }
  )
  return data
}

export async function uploadStockAdjustmentImport(
  companyUuid: string,
  file: File
) {
  const form = new FormData()
  form.append("file", file, file.name)
  const { data } = await apiClient.post<
    ApiSuccessResponse<StockImportUploadResponse>
  >(`${importBase(companyUuid)}/import`, form, {
    headers: companyHeaders(companyUuid),
    timeout: 120_000,
  })
  return data.data
}

export async function listStockAdjustmentImports(
  companyUuid: string,
  params?: StockImportHistoryParams
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<StockImportHistoryItem>>
  >(`${importBase(companyUuid)}/imports`, {
    headers: companyHeaders(companyUuid),
    params: { page: params?.page ?? 0, size: params?.size ?? 10 },
  })
  return data.data
}

export async function getStockAdjustmentImportJob(
  companyUuid: string,
  jobUuid: string
) {
  const { data } = await apiClient.get<ApiSuccessResponse<StockImportJobDetail>>(
    `${importBase(companyUuid)}/imports/${jobUuid}`,
    { headers: companyHeaders(companyUuid) }
  )
  return data.data
}

export async function downloadStockAdjustmentImportResults(
  companyUuid: string,
  jobUuid: string,
  format: "csv" | "xlsx"
) {
  const { data } = await apiClient.get<Blob>(
    `${importBase(companyUuid)}/imports/${jobUuid}/results.${format}`,
    {
      headers: companyHeaders(companyUuid),
      responseType: "blob",
    }
  )
  return data
}

export async function downloadStockAdjustmentImportOriginal(
  companyUuid: string,
  jobUuid: string
) {
  const { data } = await apiClient.get<Blob>(
    `${importBase(companyUuid)}/imports/${jobUuid}/original`,
    {
      headers: companyHeaders(companyUuid),
      responseType: "blob",
    }
  )
  return data
}
