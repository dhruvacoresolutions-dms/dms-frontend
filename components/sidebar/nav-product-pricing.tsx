"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRightIcon, Package } from "lucide-react"

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
import {
  CollapsedNavPopup,
  type CollapsedNavLink,
} from "@/components/sidebar/collapsed-nav-popup"
import { cn } from "@/lib/utils"
import type { MainNav, SidebarNavItem } from "@/types/components/sidebar"

function normalizePath(pathname: string) {
  return pathname.replace(/^\/companies\/[^/]+/, "/companies/current")
}

function collectUrls(items: MainNav): string[] {
  return items
    .flatMap((item) => [item.url, ...collectUrls(item.items ?? [])])
    .filter((url) => url !== "#")
}

function collectLeafLinks(items: MainNav): CollapsedNavLink[] {
  return items.flatMap((item) => {
    if (item.items?.length) return collectLeafLinks(item.items)
    if (item.url === "#") return []
    return [{ title: item.title, url: item.url }]
  })
}

function getActiveUrl(pathname: string, items: MainNav): string | null {
  const normalized = normalizePath(pathname)
  let best: string | null = null
  for (const url of collectUrls(items)) {
    if (normalized === url || normalized.startsWith(url + "/")) {
      if (!best || url.length > best.length) best = url
    }
  }
  return best
}

function isBranchActive(item: SidebarNavItem, activeUrl: string | null): boolean {
  if (!activeUrl) return false
  if (
    item.url !== "#" &&
    (activeUrl === item.url || activeUrl.startsWith(item.url + "/"))
  ) {
    return true
  }
  return item.items?.some((child) => isBranchActive(child, activeUrl)) ?? false
}

type RenderContext = {
  activeUrl: string | null
  iconMode: boolean
  openMap: Record<string, boolean>
  setOpen: (key: string, next: boolean) => void
  closeMobileSidebar: () => void
}

function renderNavItems(
  items: MainNav,
  ctx: RenderContext,
  parentKey: string,
  depth: number
): React.ReactNode {
  return items.map((item) => {
    const hasChildren = !!item.items?.length
    const key = `${parentKey}::${item.title}`
    const isOpen = hasChildren
      ? (ctx.openMap[key] ?? isBranchActive(item, ctx.activeUrl))
      : false

    // Icon-collapsed desktop mode hides inline submenus, so top-level
    // parents with children render a hover flyout instead.
    if (hasChildren && ctx.iconMode && depth === 0) {
      return (
        <CollapsedNavPopup
          key={key}
          title={item.title}
          icon={item.icon && <item.icon />}
          triggerActive={isBranchActive(item, ctx.activeUrl)}
          links={collectLeafLinks([item])}
        />
      )
    }

    const chevron = (
      <ChevronRightIcon
        className={cn(
          "ml-auto shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isOpen && "rotate-90"
        )}
      />
    )

    let trigger: React.ReactNode
    if (hasChildren) {
      trigger =
        depth === 0 ? (
          <SidebarMenuButton tooltip={item.title} render={<CollapsibleTrigger />}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {chevron}
          </SidebarMenuButton>
        ) : (
          <SidebarMenuSubButton render={<CollapsibleTrigger />}>
            <span>{item.title}</span>
            {chevron}
          </SidebarMenuSubButton>
        )
    } else if (depth === 0) {
      trigger = (
        <SidebarMenuButton
          tooltip={item.title}
          isActive={ctx.activeUrl === item.url}
          render={<Link href={item.url} />}
          onClick={ctx.closeMobileSidebar}
        >
          {item.icon && <item.icon />}
          <span>{item.title}</span>
        </SidebarMenuButton>
      )
    } else {
      trigger = (
        <SidebarMenuSubButton
          isActive={ctx.activeUrl === item.url}
          render={<Link href={item.url} />}
          onClick={ctx.closeMobileSidebar}
        >
          <span>{item.title}</span>
        </SidebarMenuSubButton>
      )
    }

    return (
      <Collapsible
        key={key}
        open={isOpen}
        onOpenChange={(next) => ctx.setOpen(key, next)}
        render={depth === 0 ? <SidebarMenuItem /> : <SidebarMenuSubItem />}
      >
        {trigger}
        {hasChildren ? (
          <CollapsibleContent>
            <SidebarMenuSub>
              {renderNavItems(item.items!, ctx, key, depth + 1)}
            </SidebarMenuSub>
          </CollapsibleContent>
        ) : null}
      </Collapsible>
    )
  })
}

export function NavProductPricing({ items }: { items: MainNav }) {
  const pathname = usePathname()
  const { state, isMobile, setOpenMobile } = useSidebar()
  const iconMode = !isMobile && state === "collapsed"
  const activeUrl = getActiveUrl(pathname, items)
  const [openMap, setOpenMap] = React.useState<Record<string, boolean>>({})

  if (items.length === 0) return null

  return (
    <SidebarGroup className="pt-2">
      <SidebarGroupLabel className="border-b border-sidebar-border/60 pb-2 mb-2 font-extrabold tracking-widest uppercase text-sidebar-foreground/70 [&>svg]:text-sidebar-foreground/70">
        <Package className="size-3.5" />
        Product &amp; Pricing
      </SidebarGroupLabel>
      <SidebarMenu>
        {renderNavItems(
          items,
          {
            activeUrl,
            iconMode,
            openMap,
            setOpen: (key, next) =>
              setOpenMap((prev) => ({ ...prev, [key]: next })),
            closeMobileSidebar: () => {
              if (isMobile) setOpenMobile(false)
            },
          },
          "product-pricing",
          0
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
