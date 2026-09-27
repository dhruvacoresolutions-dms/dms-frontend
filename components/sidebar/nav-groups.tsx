"use client"

import Link from "next/link"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { ChevronRightIcon } from "lucide-react"
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
import { cn } from "@/lib/utils"
import type { NavGroup, SidebarNavItem } from "@/types/components/sidebar"

function normalizePath(pathname: string) {
  return pathname.replace(/^\/companies\/[^/]+/, "/companies/current")
}

function collectUrlsRecursive(items: SidebarNavItem[]): string[] {
  return items.flatMap((i) => [i.url, ...collectUrlsRecursive(i.items ?? [])]).filter((u) => u !== "#")
}

function getActiveUrl(pathname: string, groups: NavGroup[]): string | null {
  const n = normalizePath(pathname)
  const urls = groups.flatMap((g) => collectUrlsRecursive(g.items))
  let best: string | null = null
  for (const url of urls) {
    if (n === url || n.startsWith(url + "/")) {
      if (!best || url.length > best.length) best = url
    }
  }
  return best
}

function isItemActive(item: SidebarNavItem, activeUrl: string | null): boolean {
  if (!activeUrl) return false
  if (item.url !== "#" && (activeUrl === item.url || activeUrl.startsWith(item.url + "/"))) return true
  return item.items?.some((sub) => isItemActive(sub, activeUrl)) ?? false
}

export function NavGroups({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname()
  const { state, isMobile, setOpenMobile } = useSidebar()
  // Icon-collapsed (desktop) mode hides inline submenus, so parents with
  // children render a hover popup instead.
  const iconMode = !isMobile && state === "collapsed"
  const activeUrl = getActiveUrl(pathname, groups)
  // Mobile: close the sheet immediately when a navigation link is tapped.
  // Parent items with children only expand — they never close.
  const closeMobileSidebar = () => {
    if (isMobile) setOpenMobile(false)
  }

  // Manual open/close overrides. Parents with an active child default to
  // open — derived during render (not in an effect) so it also works when
  // permission-filtered groups arrive after mount, e.g. on reload.
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({})

  const toggle = (key: string, next: boolean) => {
    setOpenMap((prev) => ({ ...prev, [key]: next }))
  }

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.label} className="pt-3">
          <SidebarGroupLabel className="border-b border-sidebar-border/60 pb-2 mb-2 font-extrabold tracking-widest uppercase text-sidebar-foreground/70 [&>svg]:text-sidebar-foreground/70">
            {group.icon && <group.icon className="size-3.5" />}
            {group.label}
          </SidebarGroupLabel>
          <SidebarMenu>
            {group.items.map((item) => {
              const hasChildren = !!item.items?.length
              const key = `${group.label}::${item.title}`
              const isOpen = hasChildren
                ? (openMap[key] ?? isItemActive(item, activeUrl))
                : false
              const active = activeUrl === item.url

              if (hasChildren && iconMode) {
                return (
                  <CollapsedNavPopup
                    key={item.title}
                    title={item.title}
                    icon={item.icon && <item.icon />}
                    triggerActive={isItemActive(item, activeUrl)}
                    links={item.items!.map((sub) => ({
                      title: sub.title,
                      url: sub.url,
                      active: activeUrl === sub.url,
                    }))}
                  />
                )
              }

              return (
                <Collapsible
                  key={item.title}
                  open={isOpen}
                  onOpenChange={(next) => toggle(key, next)}
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
                      isActive={active}
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
                        {item.items!.map((sub) => (
                          <SidebarMenuSubItem key={sub.title}>
                            <SidebarMenuSubButton
                              isActive={activeUrl === sub.url}
                              render={<Link href={sub.url} />}
                              onClick={closeMobileSidebar}
                            >
                              <span>{sub.title}</span>
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
      ))}
    </>
  )
}
