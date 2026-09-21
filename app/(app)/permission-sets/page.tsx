"use client"

import { useAuthStore } from "@/stores/auth-store"
import { PermissionSetListView } from "@/features/permission-sets/components/PermissionSetListView"
import { RouteGate } from "@/components/auth/RouteGate"
import { PERMISSIONS } from "@/lib/permissions"

export default function PermissionSetsPage() {
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  return (
    <RouteGate permission={PERMISSIONS.PERMISSION_SET.VIEW}>
      <PermissionSetListView companyUuid={companyUuid} basePath="/permission-sets" />
    </RouteGate>
  )
}
