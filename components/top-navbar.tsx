"use client"

import { usePathname } from "next/navigation"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { companiesNav, mainNav, navGroups } from "@/configs/components/sidebar"
import { useAuthStore } from "@/stores/auth-store"
import { cn } from "@/lib/utils"
import type { MainNav, NavGroup } from "@/types/components/sidebar"

function normalizePath(pathname: string) {
  return pathname.replace(/^\/companies\/[^/]+/, "/companies/current")
}

function collectUrlsRecursive(items: import("@/types/components/sidebar").SidebarNavItem[]): string[] {
  return items.flatMap((i) => [i.url, ...collectUrlsRecursive(i.items ?? [])]).filter((u) => u !== "#")
}

function getAllUrls(nav: MainNav, groups: NavGroup[] = []): string[] {
  const navUrls = collectUrlsRecursive(nav)
  const groupUrls = groups.flatMap((g) => collectUrlsRecursive(g.items))
  return [...navUrls, ...groupUrls]
}

function getActiveUrl(pathname: string, nav: MainNav, groups: NavGroup[] = []): string | null {
  const n = normalizePath(pathname)
  const urls = getAllUrls(nav, groups)
  let best: string | null = null
  for (const url of urls) {
    if (n === url || n.startsWith(url + "/")) {
      if (!best || url.length > best.length) best = url
    }
  }
  return best
}

export function TopNavBar() {
  const pathname = usePathname()
  const isPlatformAdmin = useAuthStore(
    (s) => s.session?.user?.roles.includes("PLATFORM_ADMINISTRATOR") ?? false
  )
  const visibleNav = isPlatformAdmin ? companiesNav : mainNav
  const visibleGroups: NavGroup[] = isPlatformAdmin ? [] : navGroups
  const activeUrl = getActiveUrl(pathname, visibleNav, visibleGroups)

  return (
    <nav
      className={cn(
        "sticky top-(--header-height) z-40 flex h-11 w-full items-center border-b",
        "bg-[var(--sidebar-background)] text-[var(--sidebar-foreground)] border-[var(--sidebar-border)]",
        "overflow-hidden"
      )}
    >
      <div className="flex h-full w-full items-center overflow-x-auto px-2 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <NavigationMenu className="max-w-none flex-1 justify-start">
          <NavigationMenuList className="flex-nowrap gap-0.5">
            {visibleNav.map((item) => {
              const hasChildren = !!item.items?.length
              const directActive = activeUrl === item.url

              if (!hasChildren) {
                return (
                  <NavigationMenuItem key={item.title}>
                    <NavigationMenuLink
                      href={item.url}
                      className={cn(
                        "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors",
                        directActive
                          ? "bg-[var(--sidebar-active)] text-[var(--sidebar-active-foreground)]"
                          : "hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-foreground)] text-[var(--sidebar-foreground)]"
                      )}
                    >
                      {item.icon && <item.icon className="size-4" />}
                      {item.title}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                )
              }

              return (
                <NavigationMenuItem key={item.title}>
                  <NavigationMenuTrigger
                    className={cn(
                      "h-8 gap-1.5 rounded-md px-2.5 text-sm",
                      "bg-transparent text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-foreground)] data-[state=open]:bg-[var(--sidebar-hover)]"
                    )}
                  >
                    {item.icon && <item.icon className="size-4" />}
                    {item.title}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="min-w-48">
                    <ul className="grid gap-1 p-1">
                      {item.items!.map((sub) => {
                        const subActive = activeUrl === sub.url
                        return (
                          <li key={sub.title}>
                            <NavigationMenuLink
                              href={sub.url}
                              className={cn(
                                "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm",
                                subActive
                                  ? "bg-[var(--sidebar-active)] text-[var(--sidebar-active-foreground)]"
                                  : "hover:bg-muted"
                              )}
                            >
                              {sub.icon && <sub.icon className="size-4" />}
                              {sub.title}
                            </NavigationMenuLink>
                          </li>
                        )
                      })}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              )
            })}
            {/* Grouped navigation — Primary/Sales/Inventory/Master/Financial/Reports — supports children like MainNav */}
            {visibleGroups.map((group) => {
              const isGroupActive = group.items.some(function check(i): boolean {
                if (activeUrl === i.url || (i.url !== "#" && activeUrl?.startsWith(i.url + "/")) ) return true
                return i.items?.some(check) ?? false
              })
              return (
                <NavigationMenuItem key={group.label}>
                  <NavigationMenuTrigger
                    className={cn(
                      "h-8 gap-1.5 rounded-md px-2.5 text-sm",
                      "bg-transparent text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-foreground)] data-[state=open]:bg-[var(--sidebar-hover)]",
                      isGroupActive && "bg-[var(--sidebar-active)] text-[var(--sidebar-active-foreground)]"
                    )}
                  >
                    {group.icon && <group.icon className="size-4" />}
                    {group.label}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="min-w-56">
                    <ul className="grid gap-1 p-1">
                      {group.items.map((sub) => {
                        const subActive = activeUrl === sub.url
                        const hasSubChildren = !!sub.items?.length
                        if (!hasSubChildren) {
                          return (
                            <li key={sub.title}>
                              <NavigationMenuLink
                                href={sub.url}
                                className={cn(
                                  "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm",
                                  subActive
                                    ? "bg-[var(--sidebar-active)] text-[var(--sidebar-active-foreground)]"
                                    : "hover:bg-muted"
                                )}
                              >
                                {sub.icon && <sub.icon className="size-4" />}
                                {sub.title}
                              </NavigationMenuLink>
                            </li>
                          )
                        }
                        // Nested sub-items (rare) — render with indent
                        return (
                          <li key={sub.title} className="grid gap-1">
                            <div className="px-2.5 py-1 text-xs font-medium text-muted-foreground">{sub.title}</div>
                            {sub.items!.map((nested) => {
                              const nestedActive = activeUrl === nested.url
                              return (
                                <NavigationMenuLink
                                  key={nested.title}
                                  href={nested.url}
                                  className={cn(
                                    "ml-2 flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm",
                                    nestedActive
                                      ? "bg-[var(--sidebar-active)] text-[var(--sidebar-active-foreground)]"
                                      : "hover:bg-muted"
                                  )}
                                >
                                  {nested.icon && <nested.icon className="size-4" />}
                                  {nested.title}
                                </NavigationMenuLink>
                              )
                            })}
                          </li>
                        )
                      })}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              )
            })}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </nav>
  )
}
