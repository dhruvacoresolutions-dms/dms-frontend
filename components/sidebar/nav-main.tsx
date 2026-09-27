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
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { CollapsedNavPopup } from "@/components/sidebar/collapsed-nav-popup"
import { ChevronRightIcon, LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"
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
  const { state, isMobile, setOpenMobile } = useSidebar()
  // Icon-collapsed (desktop) mode hides inline submenus, so parents with
  // children render a hover popup instead.
  const iconMode = !isMobile && state === "collapsed"
  const activeUrl = getActiveUrl(pathname, items)
  // Mobile: close the sheet immediately when a navigation link is tapped.
  // Parent items with children only expand — they never close.
  const closeMobileSidebar = () => {
    if (isMobile) setOpenMobile(false)
  }
  // Manual open/close overrides. Parents with an active child default to
  // open — derived during render (not in an effect) so it also works when
  // permission-filtered items arrive after mount, e.g. on reload.
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({})

  const toggle = (title: string, next: boolean) => {
    setOpenMap((prev) => ({ ...prev, [title]: next }))
  }

  return (
    <SidebarGroup className="pt-2">
      <SidebarGroupLabel className="border-b border-sidebar-border/60 pb-2 mb-2 font-extrabold tracking-widest uppercase text-sidebar-foreground/70 [&>svg]:text-sidebar-foreground/70">
        <LayoutDashboard className="size-3.5" />
        DMS
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const hasChildren = !!item.items?.length
          const isOpen = hasChildren
            ? (openMap[item.title] ?? isGroupActive(item, pathname, items))
            : false
          if (hasChildren && iconMode) {
            return (
              <CollapsedNavPopup
                key={item.title}
                title={item.title}
                icon={item.icon && <item.icon />}
                triggerActive={isGroupActive(item, pathname, items)}
                links={item.items!.map((subItem) => ({
                  title: subItem.title,
                  url: subItem.url,
                  active: activeUrl === subItem.url,
                }))}
              />
            )
          }
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
                  render={<CollapsibleTrigger />}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  <ChevronRightIcon
                    className={cn(
                      "ml-auto shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      isOpen && "rotate-90"
                    )}
                  />
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={activeUrl === item.url}
                  render={<Link href={item.url} />}
                  onClick={closeMobileSidebar}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              )}
              {hasChildren ? (
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items!.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          isActive={activeUrl === subItem.url}
                          render={<Link href={subItem.url} />}
                          onClick={closeMobileSidebar}
                        >
                          <span>{subItem.title}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              ) : null}
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
