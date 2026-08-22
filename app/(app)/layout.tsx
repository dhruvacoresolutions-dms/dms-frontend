"use client"

import SidebarLayout from "@/components/sidebar"
import { AppBootstrap } from "@/components/auth/AppBootstrap"

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <AppBootstrap>
      <SidebarLayout>{children}</SidebarLayout>
    </AppBootstrap>
  )
}
