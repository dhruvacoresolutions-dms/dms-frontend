"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  markAllStockAdjustmentNotificationsRead,
  markStockAdjustmentNotificationRead,
} from "../api/stock-adjustment-notification.api"
import { stockAdjustmentKeys } from "../api/inventory-keys"

export function useStockAdjustmentNotificationActions(
  companyUuid: string,
  distributorUuid: string
) {
  const queryClient = useQueryClient()

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: stockAdjustmentKeys.notifications(
        companyUuid,
        distributorUuid
      ),
    })

  const markRead = useMutation({
    mutationFn: (notificationUuid: string) =>
      markStockAdjustmentNotificationRead(
        companyUuid,
        distributorUuid,
        notificationUuid
      ),
    onSuccess: invalidate,
  })

  const markAllRead = useMutation({
    mutationFn: () =>
      markAllStockAdjustmentNotificationsRead(
        companyUuid,
        distributorUuid
      ),
    onSuccess: invalidate,
  })

  return { markRead, markAllRead }
}
