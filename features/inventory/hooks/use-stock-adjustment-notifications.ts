"use client"

import { useQuery } from "@tanstack/react-query"
import { listStockAdjustmentNotifications } from "../api/stock-adjustment-notification.api"
import { stockAdjustmentKeys } from "../api/inventory-keys"
import type { StockNotificationListParams } from "../api/inventory.types"

export function useStockAdjustmentNotifications(
  companyUuid: string,
  distributorUuid: string,
  params?: StockNotificationListParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: stockAdjustmentKeys.notifications(
      companyUuid,
      distributorUuid,
      params
    ),
    queryFn: () =>
      listStockAdjustmentNotifications(
        companyUuid,
        distributorUuid,
        params
      ),
    enabled:
      !!companyUuid && !!distributorUuid && (options?.enabled ?? true),
    // Light polling keeps the unread badge fresh for approvals/rejections
    // without a manual refresh. Paused automatically when the tab is hidden
    // (refetchIntervalInBackground: false) and disabled when the hook is off.
    refetchInterval:
      !!companyUuid && !!distributorUuid && (options?.enabled ?? true)
        ? 30_000
        : false,
    refetchIntervalInBackground: false,
  })
}
