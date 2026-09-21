"use client"

import DashboardPage from "@/components/dashboard"
import { RouteGate } from "@/components/auth/RouteGate"
import { PERMISSIONS } from "@/lib/permissions"

export default function Page() {
  return (
    <RouteGate permission={PERMISSIONS.DASHBOARD.VIEW}>
      <DashboardPage />
    </RouteGate>
  )
}
