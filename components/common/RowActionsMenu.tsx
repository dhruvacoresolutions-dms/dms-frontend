"use client"

import { Fragment } from "react"
import { MoreHorizontal, type LucideIcon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type RowActionMenuItem = {
  key: string
  label: string
  icon?: LucideIcon
  variant?: "default" | "destructive"
  onClick: () => void
}

export function RowActionsMenu({ items }: { items: RowActionMenuItem[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="cursor-pointer">
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {items.map((item, index) => {
          const Icon = item.icon
          return (
            <Fragment key={item.key}>
              {index > 0 ? <DropdownMenuSeparator /> : null}
              <DropdownMenuItem
                variant={item.variant ?? "default"}
                onClick={item.onClick}
              >
                {Icon ? <Icon className="mr-2 size-4" /> : null}
                {item.label}
              </DropdownMenuItem>
            </Fragment>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
