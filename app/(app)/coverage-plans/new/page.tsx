"use client"

import { useRouter } from "next/navigation"

import { useAuthStore } from "@/stores/auth-store"
import { PageHeader } from "@/components/common/PageHeader"
import { RouteGate } from "@/components/auth/RouteGate"
import { PERMISSIONS } from "@/lib/permissions"
import { CoveragePlanForm } from "@/features/coverage-plans/components/CoveragePlanForm"

export default function NewCoveragePlanPage() {
  return (
    <RouteGate
      permissions={[
        PERMISSIONS.COVERAGE_PLAN.CREATE,
        PERMISSIONS.COVERAGE_PLAN.MANAGE,
      ]}
      require="any"
    >
      <NewCoveragePlanContent />
    </RouteGate>
  )
}

function NewCoveragePlanContent() {
  const router = useRouter()
  const companyUuid =
    useAuthStore((state) => state.session?.user?.companyUuid) ?? "current"

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Create Coverage Plan"
        description="Choose the coverage period and weekly customer template. Employee submissions wait for the direct manager; manager/admin creations are approved immediately."
        backHref="/coverage-plans"
        backLabel="Back to coverage plans"
      />
      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <CoveragePlanForm
          companyUuid={companyUuid}
          onDone={(plan) => router.push(`/coverage-plans/${plan.uuid}`)}
          onCancel={() => router.push("/coverage-plans")}
        />
      </div>
    </div>
  )
}
