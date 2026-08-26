"use client"

import * as React from "react"

import { NavMain } from "@/components/sidebar/nav-main"
import { CompaniesNav } from "@/components/sidebar/companies-nav"
import { Sidebar, SidebarContent } from "@/components/ui/sidebar"
import { mainNav } from "@/configs/components/sidebar"
import { useAuthStore } from "@/stores/auth-store"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const isPlatformAdmin = useAuthStore(
    (s) => s.session?.user?.roles.includes("PLATFORM_ADMINISTRATOR") ?? false
  )

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
      collapsible={"icon"}
    >
      <SidebarContent>
        {isPlatformAdmin && <CompaniesNav />}
        {!isPlatformAdmin && <NavMain items={mainNav} />}
      </SidebarContent>
    </Sidebar>
  )
}
