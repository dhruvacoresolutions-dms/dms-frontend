"use client"

import * as React from "react"

import { NavMain } from "@/components/sidebar/nav-main"
import { Sidebar, SidebarContent } from "@/components/ui/sidebar"
import { mainNav } from "@/configs/components/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
      collapsible={"icon"}
    >
      <SidebarContent>
        <NavMain items={mainNav} />
      </SidebarContent>
    </Sidebar>
  )
}
