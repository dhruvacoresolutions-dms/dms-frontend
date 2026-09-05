"use client"

import { usePathname } from "next/navigation"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { companiesNav } from "@/configs/components/sidebar"

export function CompaniesNav() {
  const pathname = usePathname()

  return (
    <SidebarGroup className="pt-2">
      <SidebarGroupLabel className="border-b border-sidebar-border/60 pb-2 mb-2 font-extrabold tracking-widest uppercase text-primary">
        Platform
      </SidebarGroupLabel>
      <SidebarMenu>
        {companiesNav.map((item) => {
          const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`)
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                isActive={isActive}
                render={<a href={item.url} />}
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
