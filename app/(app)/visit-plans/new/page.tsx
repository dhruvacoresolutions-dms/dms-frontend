"use client"

import { useRouter } from "next/navigation"

import { useAuthStore } from "@/stores/auth-store"
import { PageHeader } from "@/components/common/PageHeader"
import { RouteGate } from "@/components/auth/RouteGate"
import { PERMISSIONS } from "@/lib/permissions"
import { VisitPlanForm } from "@/features/visit-plans/components/VisitPlanForm"

export default function NewVisitPlanPage() {
  return (
    <RouteGate permission={PERMISSIONS.VISIT_PLAN.CREATE}>
      <NewVisitPlanContent />
    </RouteGate>
  )
}

function NewVisitPlanContent() {
  const router = useRouter()
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Create Visit Plan"
        description="Plan a single-day local route or a multi-day outstation trip, then submit it for approval"
        backHref="/visit-plans"
        backLabel="Back to visit plans"
      />
      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <VisitPlanForm
          companyUuid={companyUuid}
          onDone={(plan) => router.push(`/visit-plans/${plan.uuid}`)}
          onCancel={() => router.push("/visit-plans")}
        />
      </div>
    </div>
  )
}
