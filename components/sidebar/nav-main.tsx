"use client"

import Link from "next/link"
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
import { ChevronRightIcon, LayoutDashboard } from "lucide-react"
import type { MainNav } from "@/types/components/sidebar"

function normalizePath(pathname: string) {
  return pathname.replace(/^\/companies\/[^/]+/, "/companies/current")
}

function getAllUrls(items: MainNav): string[] {
  return items.flatMap((i) => [i.url, ...(i.items?.map((s) => s.url) ?? [])]).filter((u) => u !== "#")
}

function getActiveUrl(pathname: string, items: MainNav): string | null {
  const n = normalizePath(pathname)
  const urls = getAllUrls(items)
  let best: string | null = null
  for (const url of urls) {
    if (n === url || n.startsWith(url + "/")) {
      if (!best || url.length > best.length) best = url
    }
  }
  return best
}

function isGroupActive(item: { url: string; items?: { url: string }[] }, pathname: string, items: MainNav) {
  const activeUrl = getActiveUrl(pathname, items)
  if (!activeUrl) return false
  if (item.url !== "#" && activeUrl === item.url) return true
  return item.items?.some((sub) => sub.url === activeUrl || activeUrl.startsWith(sub.url + "/")) ?? false
}

export function NavMain({ items }: { items: MainNav }) {
  const pathname = usePathname()
  const activeUrl = getActiveUrl(pathname, items)
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const item of items) {
      if (item.items?.length) {
        initial[item.title] = isGroupActive(item, pathname, items)
      }
    }
    return initial
  })

  const toggle = (title: string, next: boolean) => {
    setOpenMap((prev) => ({ ...prev, [title]: next }))
  }

  return (
    <SidebarGroup className="pt-2">
      <SidebarGroupLabel className="border-b border-sidebar-border/60 pb-2 mb-2 font-extrabold tracking-widest uppercase text-primary [&>svg]:text-primary">
        <LayoutDashboard className="size-3.5" />
        DMS
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const hasChildren = !!item.items?.length
          const isOpen = hasChildren ? (openMap[item.title] ?? false) : false
          return (
            <Collapsible
              key={item.title}
              open={isOpen}
              onOpenChange={(next) => toggle(item.title, next)}
              render={<SidebarMenuItem />}
            >
              {hasChildren ? (
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={false}
                  onClick={() => toggle(item.title, !isOpen)}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={activeUrl === item.url}
                  render={<Link href={item.url} />}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              )}
              {hasChildren ? (
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
                      {item.items!.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            isActive={activeUrl === subItem.url}
                            render={<Link href={subItem.url} />}
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
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
