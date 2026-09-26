"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"
import { Menu, PanelLeftIcon } from "lucide-react"
import { HeaderUserMenu } from "./user-menu"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { useNavigationStore } from "@/stores/navigation-store"
import { SidebarBreadcrumbs } from "@/components/sidebar/breadcrumbs"

export function SiteHeader() {
  const { toggleSidebar, isMobile } = useSidebar()
  const layout = useNavigationStore((s) => s.layout)
  const isTopNav = layout === "topnav"

  return (
    <header className="sticky top-0 z-50 flex w-full items-center border-b border-topbar-border bg-topbar text-topbar-foreground">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        {!isTopNav && (
          <>
            <Button className="h-8 w-8 text-topbar-foreground hover:bg-topbar-foreground/10 hover:text-topbar-foreground" variant="ghost" size="icon" onClick={toggleSidebar}>
              {isMobile ? <Menu /> : <PanelLeftIcon />}
            </Button>
            <Separator orientation="vertical" className="mr-2 bg-topbar-border data-vertical:h-4 data-vertical:self-auto" />
          </>
        )}
        <SidebarBreadcrumbs />
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <HeaderUserMenu />
        </div>
      </div>
    </header>
  )
}
