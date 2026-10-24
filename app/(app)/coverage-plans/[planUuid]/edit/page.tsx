"use client"

import { useParams, useRouter } from "next/navigation"

import { useAuthStore } from "@/stores/auth-store"
import { PageHeader } from "@/components/common/PageHeader"
import { LoadingState } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { ForbiddenState } from "@/components/common/ForbiddenState"
import { RouteGate } from "@/components/auth/RouteGate"
import { PERMISSIONS } from "@/lib/permissions"
import { useCoveragePlan } from "@/features/coverage-plans/hooks/use-coverage-plan"
import { useCoveragePlanCapabilities } from "@/features/coverage-plans/hooks/use-coverage-plan-capabilities"
import { CoveragePlanForm } from "@/features/coverage-plans/components/CoveragePlanForm"
import { getCoveragePlanErrorMessage } from "@/features/coverage-plans/lib/coverage-plan.utils"

export default function EditCoveragePlanPage() {
  return (
    <RouteGate
      permissions={[
        PERMISSIONS.COVERAGE_PLAN.CREATE,
        PERMISSIONS.COVERAGE_PLAN.MANAGE,
      ]}
      require="any"
    >
      <EditCoveragePlanContent />
    </RouteGate>
  )
}

function EditCoveragePlanContent() {
  const router = useRouter()
  const params = useParams<{ planUuid: string }>()
  const planUuid = params?.planUuid ?? ""
  const companyUuid =
    useAuthStore((state) => state.session?.user?.companyUuid) ?? "current"

  const { data, isLoading, error, refetch } = useCoveragePlan(
    companyUuid,
    planUuid
  )
  const plan = data?.plan
  const capabilities = useCoveragePlanCapabilities(plan)

  if (isLoading) {
    return <LoadingState message="Loading coverage plan..." />
  }

  if (error || !plan) {
    return (
      <ErrorState
        message={getCoveragePlanErrorMessage(
          error,
          "Coverage plan not found or unavailable"
        )}
        onRetry={() => void refetch()}
      />
    )
  }

  if (!capabilities.canEdit) {
    const description =
      plan.status === "PENDING_APPROVAL"
        ? "A pending plan cannot be edited. The employee must withdraw it first."
        : plan.status === "CANCELLED"
          ? "Cancelled plans cannot be edited or restored."
          : plan.status === "APPROVED"
            ? capabilities.isOwnPlan
              ? "Managers cannot edit their own approved plan. Ask another manager or an administrator."
              : "Editing an approved plan requires coverage plan manage access."
            : "Only the employee who owns a rejected or withdrawn plan can edit it, and coverage plan create access is required."
    return (
      <ForbiddenState
        title="This coverage plan cannot be edited"
        description={description}
      />
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Edit coverage plan"
        description={
          plan.status === "APPROVED"
            ? "Saving regenerates future generated visit plans. Past or started plans are kept."
            : "Update the replacement template. Saving resubmits it for manager approval."
        }
        backHref={`/coverage-plans/${plan.uuid}`}
        backLabel="Back to coverage plan"
      />
      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <CoveragePlanForm
          companyUuid={companyUuid}
          plan={plan}
          onDone={(saved) => router.push(`/coverage-plans/${saved.uuid}`)}
          onCancel={() => router.push(`/coverage-plans/${plan.uuid}`)}
        />
      </div>
    </div>
  )
}
