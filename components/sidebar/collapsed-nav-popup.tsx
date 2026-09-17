"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"

export type CollapsedNavLink = {
  title: string
  url: string
  active?: boolean
}

type CollapsedNavPopupProps = {
  title: string
  icon?: React.ReactNode
  /** Highlights the icon trigger when one of its children is active */
  triggerActive?: boolean
  links: CollapsedNavLink[]
}

/** Delay before the popup closes after the cursor leaves, so the gap
 * between the sidebar icon and the popup can be crossed. */
const CLOSE_DELAY_MS = 200

/**
 * Flyout submenu for icon-collapsed sidebar mode. Opens on hover next to
 * the sidebar so parent items with children stay reachable/clickable.
 * Rendered in a portal, so it is not clipped by the sidebar container.
 */
export function CollapsedNavPopup({
  title,
  icon,
  triggerActive = false,
  links,
}: CollapsedNavPopupProps) {
  const [open, setOpen] = React.useState(false)
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }
  const openMenu = () => {
    cancelClose()
    setOpen(true)
  }
  const scheduleClose = () => {
    cancelClose()
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS)
  }

  React.useEffect(() => cancelClose, [])

  return (
    <SidebarMenuItem>
      <div onMouseEnter={openMenu} onMouseLeave={scheduleClose}>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger render={<SidebarMenuButton isActive={triggerActive} />}>
            {icon}
            <span>{title}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="start"
            sideOffset={10}
            className="min-w-48"
            onMouseEnter={openMenu}
            onMouseLeave={scheduleClose}
          >
            <DropdownMenuGroup className="flex flex-col gap-1">
              <DropdownMenuLabel>{title}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {links.map((link) => (
                <DropdownMenuItem
                  key={link.title}
                  render={<Link href={link.url} />}
                  className={cn(link.active && "bg-accent font-medium")}
                >
                  <span>{link.title}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </SidebarMenuItem>
  )
}
