"use client"

import { useAuthStore } from "@/stores/auth-store"
import { RoleListView } from "@/features/roles/components/RoleListView"
import { RouteGate } from "@/components/auth/RouteGate"
import { PERMISSIONS } from "@/lib/permissions"

export default function RolesPage() {
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  return (
    <RouteGate permission={PERMISSIONS.ROLE.VIEW}>
      <RoleListView companyUuid={companyUuid} basePath="/roles" />
    </RouteGate>
  )
}
