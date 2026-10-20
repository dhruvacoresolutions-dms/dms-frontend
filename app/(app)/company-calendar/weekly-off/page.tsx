"use client"

import { useAuthStore } from "@/stores/auth-store"
import { PageHeader } from "@/components/common/PageHeader"
import { WeeklyOffRuleForm } from "@/features/company-calendar/components/WeeklyOffRuleForm"
import { RouteGate } from "@/components/auth/RouteGate"
import { PERMISSIONS } from "@/lib/permissions"

export default function WeeklyOffPage() {
  return (
    <RouteGate permission={PERMISSIONS.COMPANY_CALENDAR.VIEW}>
      <WeeklyOffContent />
    </RouteGate>
  )
}

function WeeklyOffContent() {
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Weekly Off Rule"
        description="Weekly offs and alternate Saturdays used to resolve the company calendar"
      />
      <div className="max-w-3xl">
        <WeeklyOffRuleForm companyUuid={companyUuid} />
      </div>
    </div>
  )
}
