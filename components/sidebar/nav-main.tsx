"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { ChevronRightIcon } from "lucide-react"
import type { MainNav } from "@/types/components/sidebar"

function isItemActive(url: string, pathname: string) {
  if (url === "#") return false
  return pathname === url || pathname.startsWith(url + "/")
}

function isGroupActive(item: { url: string; items?: { url: string }[] }, pathname: string) {
  if (isItemActive(item.url, pathname)) return true
  return item.items?.some((sub) => isItemActive(sub.url, pathname)) ?? false
}

export function NavMain({ items }: { items: MainNav }) {
  const pathname = usePathname()
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const item of items) {
      if (item.items?.length) {
        initial[item.title] = isGroupActive(item, pathname)
      }
    }
    return initial
  })

  const toggle = (title: string, next: boolean) => {
    setOpenMap((prev) => ({ ...prev, [title]: next }))
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>DMS</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            open={item.items?.length ? openMap[item.title] ?? false : false}
            onOpenChange={(next) => toggle(item.title, next)}
            render={<SidebarMenuItem />}
          >
            <SidebarMenuButton
              tooltip={item.title}
              isActive={isItemActive(item.url, pathname)}
              render={<a href={item.url} />}
            >
              {item.icon && <item.icon />}
              <span>{item.title}</span>
            </SidebarMenuButton>
            {item.items?.length ? (
              <>
                <SidebarMenuAction
                  render={<CollapsibleTrigger />}
                  className="aria-expanded:rotate-90"
                >
                  <ChevronRightIcon />
                  <span className="sr-only">Toggle</span>
                </SidebarMenuAction>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          isActive={isItemActive(subItem.url, pathname)}
                          render={<a href={subItem.url} />}
                        >
                          <span>{subItem.title}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </>
            ) : null}
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
