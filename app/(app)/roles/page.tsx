"use client"

import { useAuthStore } from "@/stores/auth-store"
import { RoleListView } from "@/features/roles/components/RoleListView"

export default function RolesPage() {
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  return <RoleListView companyUuid={companyUuid} basePath="/roles" />
}
