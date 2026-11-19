import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { companyHeaders, distributorBase } from "./inventory-utils"
import type {
  StockNotification,
  StockNotificationListParams,
  StockNotificationPage,
} from "./inventory.types"

const notificationsBase = (companyUuid: string, distributorUuid: string) =>
  `${distributorBase(companyUuid, distributorUuid)}/stock-adjustment-notifications`

export async function listStockAdjustmentNotifications(
  companyUuid: string,
  distributorUuid: string,
  params?: StockNotificationListParams
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<StockNotificationPage>
  >(notificationsBase(companyUuid, distributorUuid), {
    headers: companyHeaders(companyUuid),
    params: {
      unreadOnly: params?.unreadOnly ?? false,
      page: params?.page ?? 0,
      size: params?.size ?? 10,
    },
  })
  return data.data
}

export async function markStockAdjustmentNotificationRead(
  companyUuid: string,
  distributorUuid: string,
  notificationUuid: string
) {
  const { data } = await apiClient.post<ApiSuccessResponse<StockNotification>>(
    `${notificationsBase(companyUuid, distributorUuid)}/${notificationUuid}/read`,
    undefined,
    { headers: companyHeaders(companyUuid) }
  )
  return data.data
}

export async function markAllStockAdjustmentNotificationsRead(
  companyUuid: string,
  distributorUuid: string
) {
  const { data } = await apiClient.post<
    ApiSuccessResponse<{ updated: number }>
  >(
    `${notificationsBase(companyUuid, distributorUuid)}/read-all`,
    undefined,
    { headers: companyHeaders(companyUuid) }
  )
  return data.data
}
