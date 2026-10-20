"use client"

import { useParams, useRouter } from "next/navigation"

import { useAuthStore } from "@/stores/auth-store"
import { PageHeader } from "@/components/common/PageHeader"
import { LoadingState } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { ForbiddenState } from "@/components/common/ForbiddenState"
import { RouteGate } from "@/components/auth/RouteGate"
import { usePermission } from "@/hooks/use-permission"
import { PERMISSIONS } from "@/lib/permissions"
import { VisitPlanForm } from "@/features/visit-plans/components/VisitPlanForm"
import { useVisitPlan } from "@/features/visit-plans/hooks/use-visit-plan"
import { getVisitPlanErrorMessage } from "@/features/visit-plans/lib/visit-plan.utils"

export default function EditVisitPlanPage() {
  return (
    <RouteGate
      permissions={[
        PERMISSIONS.VISIT_PLAN.CREATE,
        PERMISSIONS.VISIT_PLAN.MANAGE,
      ]}
      require="any"
    >
      <EditVisitPlanContent />
    </RouteGate>
  )
}

function EditVisitPlanContent() {
  const params = useParams<{ planUuid: string }>()
  const planUuid = params.planUuid
  const router = useRouter()
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const selfEmployeeUuid =
    useAuthStore((s) => s.session?.user?.employeeUuid) ?? null
  const { can } = usePermission()

  const { data, isLoading, error, refetch } = useVisitPlan(
    companyUuid,
    planUuid
  )

  const plan = data?.plan

  if (isLoading) {
    return <LoadingState message="Loading visit plan..." />
  }

  if (error) {
    return (
      <ErrorState
        message={getVisitPlanErrorMessage(error, "Failed to load visit plan")}
        onRetry={() => void refetch()}
      />
    )
  }

  if (!plan) {
    return (
      <ErrorState
        message="Visit plan not found"
        onRetry={() => void refetch()}
      />
    )
  }

  if (plan.status === "PENDING_APPROVAL") {
    return (
      <ForbiddenState
        title="Plan cannot be edited"
        description="A plan awaiting approval cannot be edited. Withdraw it first, then edit and resubmit."
      />
    )
  }

  const approved = plan.status === "APPROVED"
  const isOwnPlan = !!selfEmployeeUuid && plan.employeeUuid === selfEmployeeUuid
  const permitted = approved
    ? can("VISIT_PLAN", "MANAGE")
    : isOwnPlan && can("VISIT_PLAN", "CREATE")

  if (!permitted) {
    return (
      <ForbiddenState
        title="Edit not allowed"
        description={
          approved
            ? "Only the employee's direct manager can edit an approved plan."
            : "Only the employee who owns this plan can edit it."
        }
      />
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Edit Visit Plan"
        description={
          approved
            ? "Update the approved plan. The status stays APPROVED."
            : "Update the plan, then resubmit it for approval."
        }
        backHref={`/visit-plans/${plan.uuid}`}
        backLabel="Back to visit plan"
      />
      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <VisitPlanForm
          key={plan.uuid}
          companyUuid={companyUuid}
          plan={plan}
          onDone={(saved) => router.push(`/visit-plans/${saved.uuid}`)}
          onCancel={() => router.push(`/visit-plans/${plan.uuid}`)}
        />
      </div>
    </div>
  )
}
