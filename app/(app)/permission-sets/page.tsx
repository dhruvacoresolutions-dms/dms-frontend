"use client"

import { useAuthStore } from "@/stores/auth-store"
import { PermissionSetListView } from "@/features/permission-sets/components/PermissionSetListView"

export default function PermissionSetsPage() {
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  return (
    <PermissionSetListView companyUuid={companyUuid} basePath="/permission-sets" />
  )
}
