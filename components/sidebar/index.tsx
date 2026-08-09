"use client"

import React, { ReactNode } from "react"
import { SidebarInset, SidebarProvider } from "../ui/sidebar"
import { SiteHeader } from "../site-header/site-header"
import { AppSidebar } from "./app-sidebar"
import { SidebarBreadcrumbs } from "./breadcrumbs"

type Props = { children?: ReactNode }

const SidebarLayout = ({ children }: Props) => {
  return (
    <div className="h-svh [--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex h-full flex-col overflow-hidden">
        <SiteHeader />
        <div className="flex min-h-0 flex-1">
          <AppSidebar />
          <SidebarInset>
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto rounded-md bg-muted/50 p-4">
              <SidebarBreadcrumbs />
              {children}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}

export default SidebarLayout
