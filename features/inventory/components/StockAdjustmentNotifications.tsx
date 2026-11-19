"use client"

import { Bell, BellRing, CheckCheck } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

import { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { useStockAdjustmentNotifications } from "../hooks/use-stock-adjustment-notifications"
import { useStockAdjustmentNotificationActions } from "../hooks/use-stock-adjustment-notification-actions"
import type {
  StockNotification,
  StockNotificationEvent,
} from "../api/inventory.types"

const EVENT_LABELS: Record<StockNotificationEvent, string> = {
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
}

const EVENT_STYLES: Record<StockNotificationEvent, string> = {
  SUBMITTED: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  APPROVED:
    "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  REJECTED: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
}

type Props = {
  companyUuid: string
  distributorUuid: string
  /** Open the matching adjustment when a notification is clicked. */
  onOpenAdjustment?: (adjustmentUuid: string) => void
}

/** Bell + unread count for stock-adjustment events (creator-only). */
export function StockAdjustmentNotifications({
  companyUuid,
  distributorUuid,
  onOpenAdjustment,
}: Props) {
  const query = useStockAdjustmentNotifications(
    companyUuid,
    distributorUuid,
    { page: 0, size: 10, unreadOnly: false },
    { enabled: !!distributorUuid }
  )
  const { markRead, markAllRead } = useStockAdjustmentNotificationActions(
    companyUuid,
    distributorUuid
  )

  const notifications = query.data?.content ?? []
  const unreadCount = query.data?.unreadCount ?? 0

  const handleSelect = (notification: StockNotification) => {
    if (!notification.readAt) {
      markRead.mutate(notification.uuid)
    }
    onOpenAdjustment?.(notification.adjustmentUuid)
  }

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "relative"
        )}
        aria-label={
          unreadCount > 0
            ? `Stock adjustment notifications, ${unreadCount} unread`
            : "Stock adjustment notifications"
        }
      >
        {unreadCount > 0 ? (
          <BellRing className="size-4" />
        ) : (
          <Bell className="size-4" />
        )}
        {unreadCount > 0 ? (
          <Badge className="absolute -top-1.5 -right-1.5 h-4 min-w-4 justify-center rounded-full px-1 text-[10px] tabular-nums">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <PopoverHeader className="flex-row items-center justify-between gap-2 border-b px-3 py-2">
          <PopoverTitle>Stock notifications</PopoverTitle>
          {unreadCount > 0 ? (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              {markAllRead.isPending ? (
                <Spinner className="mr-1 size-3" />
              ) : (
                <CheckCheck className="mr-1 size-3.5" />
              )}
              Mark all
            </Button>
          ) : null}
        </PopoverHeader>

        <ScrollArea className="max-h-80">
          {query.isLoading ? (
            <div className="flex items-center justify-center gap-2 px-3 py-8 text-sm text-muted-foreground">
              <Spinner className="size-4" /> Loading…
            </div>
          ) : notifications.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              No notifications yet. Events appear here when your adjustments are
              submitted, approved or rejected.
            </p>
          ) : (
            <ul className="divide-y">
              {notifications.map((notification) => (
                <li key={notification.uuid}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full flex-col gap-1 px-3 py-2.5 text-left transition-colors hover:bg-muted/60",
                      !notification.readAt && "bg-primary/5"
                    )}
                    onClick={() => handleSelect(notification)}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-medium",
                            EVENT_STYLES[notification.event]
                          )}
                        >
                          {EVENT_LABELS[notification.event] ??
                            notification.event}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {notification.referenceNo}
                        </span>
                      </span>
                      {!notification.readAt ? (
                        <span
                          className="size-1.5 shrink-0 rounded-full bg-primary"
                          aria-label="Unread"
                        />
                      ) : null}
                    </span>
                    <span className="text-sm">{notification.message}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {formatRelative(notification.createdAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

function formatRelative(value?: string | null) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return formatDistanceToNow(date, { addSuffix: true })
}
