"use client"

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
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
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
  const activeUrl = getActiveUrl(pathname, groups)

  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const g of groups) {
      for (const item of g.items) {
        if (item.items?.length && isItemActive(item, activeUrl)) {
          initial[`${g.label}::${item.title}`] = true
        }
      }
    }
    return initial
  })

  const toggle = (key: string, next: boolean) => {
    setOpenMap((prev) => ({ ...prev, [key]: next }))
  }

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.label} className="pt-3">
          <SidebarGroupLabel className="border-b border-sidebar-border/60 pb-2 mb-2 font-extrabold tracking-widest uppercase text-primary [&>svg]:text-primary">
            {group.icon && <group.icon className="size-3.5" />}
            {group.label}
          </SidebarGroupLabel>
          <SidebarMenu>
            {group.items.map((item) => {
              const hasChildren = !!item.items?.length
              const key = `${group.label}::${item.title}`
              const isOpen = hasChildren ? (openMap[key] ?? false) : false
              const active = activeUrl === item.url

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
                      onClick={() => toggle(key, !isOpen)}
                    >
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={active}
                      render={<a href={item.url} />}
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
                          {item.items!.map((sub) => (
                            <SidebarMenuSubItem key={sub.title}>
                              <SidebarMenuSubButton
                                isActive={activeUrl === sub.url}
                                render={<a href={sub.url} />}
                              >
                                <span>{sub.title}</span>
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
      ))}
    </>
  )
}
