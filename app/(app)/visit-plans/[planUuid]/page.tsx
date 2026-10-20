"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  CheckCircle2,
  Pencil,
  RotateCcw,
  ShieldCheck,
  Undo2,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { useAuthStore } from "@/stores/auth-store"
import { PageHeader } from "@/components/common/PageHeader"
import { LoadingState } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { RouteGate } from "@/components/auth/RouteGate"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { PERMISSIONS } from "@/lib/permissions"
import { ApproveVisitPlanDialog } from "@/features/visit-plans/components/ApproveVisitPlanDialog"
import { RejectVisitPlanDialog } from "@/features/visit-plans/components/RejectVisitPlanDialog"
import { VisitPlanSummaryCard } from "@/features/visit-plans/components/VisitPlanSummaryCard"
import { VisitPlanDaysCard } from "@/features/visit-plans/components/VisitPlanDaysCard"
import { VisitPlanAuditTrail } from "@/features/visit-plans/components/VisitPlanAuditTrail"
import { useVisitPlan } from "@/features/visit-plans/hooks/use-visit-plan"
import { useVisitPlanCapabilities } from "@/features/visit-plans/hooks/use-visit-plan-capabilities"
import { useWithdrawVisitPlan } from "@/features/visit-plans/hooks/use-withdraw-visit-plan"
import { useResubmitVisitPlan } from "@/features/visit-plans/hooks/use-resubmit-visit-plan"
import {
  formatVisitPlanDateRange,
  getVisitPlanErrorMessage,
} from "@/features/visit-plans/lib/visit-plan.utils"
import type { VisitPlan } from "@/features/visit-plans/api/visit-plan.types"

export default function VisitPlanDetailPage() {
  return (
    <RouteGate permission={PERMISSIONS.VISIT_PLAN.VIEW}>
      <VisitPlanDetailContent />
    </RouteGate>
  )
}

function VisitPlanDetailContent() {
  const params = useParams<{ planUuid: string }>()
  const planUuid = params.planUuid
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"

  const { data, isLoading, error, refetch } = useVisitPlan(
    companyUuid,
    planUuid
  )
  const plan = data?.plan
  const capabilities = useVisitPlanCapabilities(plan)

  const withdrawMutation = useWithdrawVisitPlan(companyUuid)
  const resubmitMutation = useResubmitVisitPlan(companyUuid)

  const [approving, setApproving] = useState<VisitPlan | null>(null)
  const [rejecting, setRejecting] = useState<VisitPlan | null>(null)
  const [withdrawing, setWithdrawing] = useState<VisitPlan | null>(null)
  const [resubmitting, setResubmitting] = useState<VisitPlan | null>(null)

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

  if (!plan || !data) {
    return (
      <ErrorState
        message="Visit plan not found"
        onRetry={() => void refetch()}
      />
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title={`Visit plan · ${formatVisitPlanDateRange(plan.fromDate, plan.toDate)}`}
        description={
          plan.planType === "OUTSTATION" ? "Outstation plan" : "Local plan"
        }
        backHref="/visit-plans"
        backLabel="Back to visit plans"
      >
        {capabilities.canEdit ? (
          <PermissionGate
            permission={
              plan.status === "APPROVED"
                ? PERMISSIONS.VISIT_PLAN.MANAGE
                : PERMISSIONS.VISIT_PLAN.CREATE
            }
          >
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={`/visit-plans/${plan.uuid}/edit`} />}
            >
              <Pencil className="mr-2 size-4" /> Edit
            </Button>
          </PermissionGate>
        ) : null}

        {capabilities.canWithdraw ? (
          <PermissionGate permission={PERMISSIONS.VISIT_PLAN.CREATE}>
            <Button variant="outline" onClick={() => setWithdrawing(plan)}>
              <Undo2 className="mr-2 size-4" /> Withdraw
            </Button>
          </PermissionGate>
        ) : null}

        {capabilities.canResubmit ? (
          <PermissionGate permission={PERMISSIONS.VISIT_PLAN.CREATE}>
            <Button variant="outline" onClick={() => setResubmitting(plan)}>
              <RotateCcw className="mr-2 size-4" /> Resubmit
            </Button>
          </PermissionGate>
        ) : null}

        {capabilities.canDecide ? (
          <>
            <PermissionGate permission={PERMISSIONS.VISIT_PLAN.APPROVE}>
              <Button variant="outline" onClick={() => setRejecting(plan)}>
                <XCircle className="mr-2 size-4" /> Reject
              </Button>
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.VISIT_PLAN.APPROVE}>
              <Button onClick={() => setApproving(plan)}>
                <ShieldCheck className="mr-2 size-4" /> Approve
              </Button>
            </PermissionGate>
          </>
        ) : null}
      </PageHeader>

      {plan.status === "APPROVED" ? (
        <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <span>
            This plan is approved. Only the employee&apos;s direct manager can
            change it, and a plan with visit execution activity cannot be
            edited.
          </span>
        </div>
      ) : null}

      <VisitPlanSummaryCard companyUuid={companyUuid} plan={plan} />
      <VisitPlanDaysCard companyUuid={companyUuid} detail={data} />
      <VisitPlanAuditTrail events={data.auditEvents} />

      <ConfirmDialog
        open={!!withdrawing}
        onOpenChange={(open) => !open && setWithdrawing(null)}
        title="Withdraw visit plan?"
        description="The manager will no longer be able to approve this plan. You can edit and resubmit it afterwards."
        confirmLabel="Withdraw"
        isLoading={withdrawMutation.isPending}
        onConfirm={() => {
          if (!withdrawing) return
          withdrawMutation.mutate(withdrawing.uuid, {
            onSuccess: () => {
              toast.success("Visit plan withdrawn")
              setWithdrawing(null)
            },
            onError: (mutationError) =>
              toast.error(
                getVisitPlanErrorMessage(
                  mutationError,
                  "Failed to withdraw visit plan"
                )
              ),
          })
        }}
      />

      <ConfirmDialog
        open={!!resubmitting}
        onOpenChange={(open) => !open && setResubmitting(null)}
        title="Resubmit visit plan?"
        description="The plan is sent back to the manager with its current date, type and customers. Edit it first if its date is in the past."
        confirmLabel="Resubmit"
        isLoading={resubmitMutation.isPending}
        onConfirm={() => {
          if (!resubmitting) return
          resubmitMutation.mutate(
            { planUuid: resubmitting.uuid },
            {
              onSuccess: () => {
                toast.success("Visit plan resubmitted")
                setResubmitting(null)
              },
              onError: (mutationError) =>
                toast.error(
                  getVisitPlanErrorMessage(
                    mutationError,
                    "Failed to resubmit visit plan"
                  )
                ),
            }
          )
        }}
      />

      <ApproveVisitPlanDialog
        companyUuid={companyUuid}
        plan={approving}
        open={!!approving}
        onOpenChange={(open) => !open && setApproving(null)}
      />
      <RejectVisitPlanDialog
        companyUuid={companyUuid}
        plan={rejecting}
        open={!!rejecting}
        onOpenChange={(open) => !open && setRejecting(null)}
      />
    </div>
  )
}
