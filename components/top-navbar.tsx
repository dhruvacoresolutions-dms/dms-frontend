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
import { mainNav } from "@/configs/components/sidebar"
import { cn } from "@/lib/utils"

function normalizePath(pathname: string) {
  return pathname.replace(/^\/companies\/[^/]+/, "/companies/current")
}

function getAllUrls(): string[] {
  return mainNav.flatMap((i) => [i.url, ...(i.items?.map((s) => s.url) ?? [])]).filter((u) => u !== "#")
}

function getActiveUrl(pathname: string): string | null {
  const n = normalizePath(pathname)
  const urls = getAllUrls()
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
  const activeUrl = getActiveUrl(pathname)

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
            {mainNav.map((item) => {
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
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </nav>
  )
}
