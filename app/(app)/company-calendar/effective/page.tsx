"use client"

import { useAuthStore } from "@/stores/auth-store"
import { PageHeader } from "@/components/common/PageHeader"
import { EffectiveCalendarView } from "@/features/company-calendar/components/EffectiveCalendarView"
import { RouteGate } from "@/components/auth/RouteGate"
import { PERMISSIONS } from "@/lib/permissions"

export default function EffectiveCalendarPage() {
  return (
    <RouteGate permission={PERMISSIONS.COMPANY_CALENDAR.VIEW}>
      <EffectiveCalendarContent />
    </RouteGate>
  )
}

function EffectiveCalendarContent() {
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Effective Calendar"
        description="Working days, holidays and accounting periods for any date range"
      />
      <EffectiveCalendarView companyUuid={companyUuid} />
    </div>
  )
}
