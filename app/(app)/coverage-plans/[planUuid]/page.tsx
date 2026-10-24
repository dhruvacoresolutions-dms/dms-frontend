"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  Ban,
  CheckCircle2,
  Clock,
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
import { useCoveragePlan } from "@/features/coverage-plans/hooks/use-coverage-plan"
import { useCoveragePlanCapabilities } from "@/features/coverage-plans/hooks/use-coverage-plan-capabilities"
import { useApproveCoveragePlan } from "@/features/coverage-plans/hooks/use-approve-coverage-plan"
import { useWithdrawCoveragePlan } from "@/features/coverage-plans/hooks/use-withdraw-coverage-plan"
import { useResubmitCoveragePlan } from "@/features/coverage-plans/hooks/use-resubmit-coverage-plan"
import { useCancelCoveragePlan } from "@/features/coverage-plans/hooks/use-cancel-coverage-plan"
import { CoveragePlanSummaryCard } from "@/features/coverage-plans/components/CoveragePlanSummaryCard"
import { CoverageWeekTemplateCard } from "@/features/coverage-plans/components/CoverageWeekTemplateCard"
import { CoverageDailyPlansCard } from "@/features/coverage-plans/components/CoverageDailyPlansCard"
import { CoverageSkippedCard } from "@/features/coverage-plans/components/CoverageSkippedCard"
import { CoveragePlanAuditTrail } from "@/features/coverage-plans/components/CoveragePlanAuditTrail"
import { RejectCoveragePlanDialog } from "@/features/coverage-plans/components/RejectCoveragePlanDialog"
import {
  coverageTotalCustomers,
  coverageWeekdayCount,
  formatCoverageDateRange,
  getCoveragePlanErrorMessage,
} from "@/features/coverage-plans/lib/coverage-plan.utils"
import type { CoveragePlanStatus } from "@/features/coverage-plans/api/coverage-plan.types"
import { cn } from "@/lib/utils"

type ConfirmAction = "withdraw" | "resubmit" | "approve" | "cancel"

const STATUS_BANNER: Record<
  CoveragePlanStatus,
  {
    icon: typeof Clock
    className: string
    title: string
    description: string
  }
> = {
  PENDING_APPROVAL: {
    icon: Clock,
    className:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
    title: "Waiting for manager approval",
    description:
      "The employee can withdraw this plan while it is pending. The direct manager can approve it or reject it with a reason.",
  },
  APPROVED: {
    icon: CheckCircle2,
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
    title: "Approved and generating visit plans",
    description:
      "Visit plans are generated for every eligible covered date. Editing the template regenerates future plans; cancelling removes future unstarted plans.",
  },
  REJECTED: {
    icon: XCircle,
    className:
      "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
    title: "Rejected",
    description:
      "The employee can edit the template and resubmit it for approval. The rejection reason is shown in the summary.",
  },
  WITHDRAWN: {
    icon: Undo2,
    className:
      "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
    title: "Withdrawn",
    description:
      "The employee withdrew this plan. It can be edited and resubmitted at any time.",
  },
  CANCELLED: {
    icon: Ban,
    className:
      "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
    title: "Cancelled",
    description:
      "No further visit plans will be generated. Past or already-started generated plans are kept.",
  },
}

export default function CoveragePlanPage() {
  return (
    <RouteGate permission={PERMISSIONS.COVERAGE_PLAN.VIEW}>
      <CoveragePlanContent />
    </RouteGate>
  )
}

function CoveragePlanContent() {
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

  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [rejecting, setRejecting] = useState(false)

  const approveMutation = useApproveCoveragePlan(companyUuid)
  const withdrawMutation = useWithdrawCoveragePlan(companyUuid)
  const resubmitMutation = useResubmitCoveragePlan(companyUuid)
  const cancelMutation = useCancelCoveragePlan(companyUuid)

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

  const banner = STATUS_BANNER[plan.status]
  const BannerIcon = banner.icon
  const isPending =
    approveMutation.isPending ||
    withdrawMutation.isPending ||
    resubmitMutation.isPending ||
    cancelMutation.isPending

  const confirmCopy: {
    title: string
    description: string
    confirmLabel: string
    variant: "default" | "destructive"
    isLoading: boolean
    onConfirm: () => void
  } | null = (() => {
    if (!confirmAction) return null

    if (confirmAction === "approve") {
      return {
        title: "Approve coverage plan?",
        description: `Approving ${formatCoverageDateRange(plan.startDate, plan.endDate)} generates a visit plan for every eligible covered date. Holidays, weekly offs, existing manual plans, inactive customers and customers outside the primary geography are skipped.`,
        confirmLabel: "Approve & generate",
        variant: "default",
        isLoading: approveMutation.isPending,
        onConfirm: () =>
          approveMutation.mutate(plan.uuid, {
            onSuccess: () => {
              toast.success("Coverage plan approved and visit plans generated")
              setConfirmAction(null)
            },
            onError: (mutationError) =>
              toast.error(
                getCoveragePlanErrorMessage(
                  mutationError,
                  "Failed to approve coverage plan"
                )
              ),
          }),
      }
    }

    if (confirmAction === "withdraw") {
      return {
        title: "Withdraw coverage plan?",
        description:
          "The manager will no longer be able to approve this plan. The employee can edit and resubmit it afterwards.",
        confirmLabel: "Withdraw",
        variant: "default",
        isLoading: withdrawMutation.isPending,
        onConfirm: () =>
          withdrawMutation.mutate(plan.uuid, {
            onSuccess: () => {
              toast.success("Coverage plan withdrawn")
              setConfirmAction(null)
            },
            onError: (mutationError) =>
              toast.error(
                getCoveragePlanErrorMessage(
                  mutationError,
                  "Failed to withdraw coverage plan"
                )
              ),
          }),
      }
    }

    if (confirmAction === "resubmit") {
      return {
        title: "Resubmit for approval?",
        description:
          "The plan is sent to the manager with its current dates, repeat rule and weekdays. Edit it first if it now starts in the past.",
        confirmLabel: "Resubmit",
        variant: "default",
        isLoading: resubmitMutation.isPending,
        onConfirm: () =>
          resubmitMutation.mutate(
            { planUuid: plan.uuid },
            {
              onSuccess: () => {
                toast.success("Coverage plan resubmitted for approval")
                setConfirmAction(null)
              },
              onError: (mutationError) =>
                toast.error(
                  getCoveragePlanErrorMessage(
                    mutationError,
                    "Failed to resubmit coverage plan"
                  )
                ),
            }
          ),
      }
    }

    return {
      title: "Cancel coverage plan?",
      description:
        "No further visit plans will be generated. Future generated plans that have not started are removed; past and started plans are kept. This cannot be undone.",
      confirmLabel: "Cancel plan",
      variant: "destructive",
      isLoading: cancelMutation.isPending,
      onConfirm: () =>
        cancelMutation.mutate(plan.uuid, {
          onSuccess: () => {
            toast.success("Coverage plan cancelled")
            setConfirmAction(null)
          },
          onError: (mutationError) =>
            toast.error(
              getCoveragePlanErrorMessage(
                mutationError,
                "Failed to cancel coverage plan"
              )
            ),
        }),
    }
  })()

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Coverage plan"
        description={`${formatCoverageDateRange(plan.startDate, plan.endDate)} · ${coverageWeekdayCount(plan)} covered weekday${coverageWeekdayCount(plan) === 1 ? "" : "s"} · ${coverageTotalCustomers(plan)} customer assignment${coverageTotalCustomers(plan) === 1 ? "" : "s"}`}
        backHref="/coverage-plans"
        backLabel="Back to coverage plans"
        action={
          <div className="flex flex-wrap items-center gap-2">
            {capabilities.canDecide ? (
              <>
                <PermissionGate permission={PERMISSIONS.COVERAGE_PLAN.APPROVE}>
                  <Button onClick={() => setConfirmAction("approve")}>
                    <ShieldCheck className="mr-2 size-4" /> Approve
                  </Button>
                </PermissionGate>
                <PermissionGate permission={PERMISSIONS.COVERAGE_PLAN.APPROVE}>
                  <Button
                    variant="destructive"
                    onClick={() => setRejecting(true)}
                  >
                    <XCircle className="mr-2 size-4" /> Reject
                  </Button>
                </PermissionGate>
              </>
            ) : null}

            {capabilities.canEdit ? (
              <PermissionGate
                permissions={[
                  PERMISSIONS.COVERAGE_PLAN.CREATE,
                  PERMISSIONS.COVERAGE_PLAN.MANAGE,
                ]}
                require="any"
              >
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={<Link href={`/coverage-plans/${plan.uuid}/edit`} />}
                >
                  <Pencil className="mr-2 size-4" /> Edit
                </Button>
              </PermissionGate>
            ) : null}

            {capabilities.canWithdraw ? (
              <PermissionGate permission={PERMISSIONS.COVERAGE_PLAN.CREATE}>
                <Button
                  variant="outline"
                  onClick={() => setConfirmAction("withdraw")}
                >
                  <Undo2 className="mr-2 size-4" /> Withdraw
                </Button>
              </PermissionGate>
            ) : null}

            {capabilities.canResubmit ? (
              <PermissionGate permission={PERMISSIONS.COVERAGE_PLAN.CREATE}>
                <Button
                  variant="outline"
                  onClick={() => setConfirmAction("resubmit")}
                >
                  <RotateCcw className="mr-2 size-4" /> Resubmit
                </Button>
              </PermissionGate>
            ) : null}

            {capabilities.canCancel ? (
              <PermissionGate permission={PERMISSIONS.COVERAGE_PLAN.MANAGE}>
                <Button
                  variant="destructive"
                  onClick={() => setConfirmAction("cancel")}
                >
                  <Ban className="mr-2 size-4" /> Cancel
                </Button>
              </PermissionGate>
            ) : null}
          </div>
        }
      />

      <div
        role="status"
        className={cn(
          "flex items-start gap-3 rounded-xl border p-3 text-sm",
          banner.className
        )}
      >
        <BannerIcon className="mt-0.5 size-5 shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold">{banner.title}</p>
          <p className="mt-0.5 opacity-90">{banner.description}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-4 lg:order-1">
          <CoverageWeekTemplateCard companyUuid={companyUuid} plan={plan} />
          <CoverageDailyPlansCard dailyPlans={data.dailyPlans ?? []} />
          <CoverageSkippedCard
            companyUuid={companyUuid}
            skipped={data.skipped ?? []}
          />
        </div>

        <aside className="order-first flex flex-col gap-4 lg:order-2">
          <CoveragePlanSummaryCard companyUuid={companyUuid} plan={plan} />
        </aside>
      </div>

      <CoveragePlanAuditTrail events={data.auditEvents ?? []} />

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={confirmCopy?.title}
        description={confirmCopy?.description}
        confirmLabel={confirmCopy?.confirmLabel}
        variant={confirmCopy?.variant}
        isLoading={confirmCopy?.isLoading ?? isPending}
        onConfirm={() => confirmCopy?.onConfirm()}
      />

      <RejectCoveragePlanDialog
        companyUuid={companyUuid}
        plan={plan}
        open={rejecting}
        onOpenChange={setRejecting}
      />
    </div>
  )
}
