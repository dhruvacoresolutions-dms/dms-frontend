"use client"

import * as React from "react"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavGroups } from "@/components/sidebar/nav-groups"
import { CompaniesNav } from "@/components/sidebar/companies-nav"
import { Sidebar, SidebarContent } from "@/components/ui/sidebar"
import { mainNav, navGroups } from "@/configs/components/sidebar"
import { useFilteredMainNav, useFilteredNavGroups } from "@/hooks/use-filtered-nav"
import { useAuthStore } from "@/stores/auth-store"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const isPlatformAdmin = useAuthStore(
    (s) => s.session?.user?.roles.includes("PLATFORM_ADMINISTRATOR") ?? false
  )
  const filteredNav = useFilteredMainNav(mainNav)
  const filteredGroups = useFilteredNavGroups(navGroups)

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
      collapsible={"icon"}
    >
      <SidebarContent>
        {isPlatformAdmin && <CompaniesNav />}
        {!isPlatformAdmin && (
          <>
            <NavMain items={filteredNav} />
            <NavGroups groups={filteredGroups} />
          </>
        )}
      </SidebarContent>
    </Sidebar>
  )
}
