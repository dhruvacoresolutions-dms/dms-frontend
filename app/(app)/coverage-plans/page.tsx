"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  Ban,
  CalendarRange,
  Eye,
  Info,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  ShieldCheck,
  Undo2,
  X,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { useAuthStore } from "@/stores/auth-store"
import { PageHeader } from "@/components/common/PageHeader"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { DateRangePicker } from "@/components/common/DateRangePicker"
import { StatusBadge } from "@/components/common/StatusBadge"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { RouteGate } from "@/components/auth/RouteGate"
import { usePermission } from "@/hooks/use-permission"
import { PERMISSIONS } from "@/lib/permissions"
import { EmployeeLabel } from "@/features/visit-plans/components/EmployeeLabel"
import { useCoveragePlans } from "@/features/coverage-plans/hooks/use-coverage-plans"
import { useWithdrawCoveragePlan } from "@/features/coverage-plans/hooks/use-withdraw-coverage-plan"
import { useResubmitCoveragePlan } from "@/features/coverage-plans/hooks/use-resubmit-coverage-plan"
import { useApproveCoveragePlan } from "@/features/coverage-plans/hooks/use-approve-coverage-plan"
import { useCancelCoveragePlan } from "@/features/coverage-plans/hooks/use-cancel-coverage-plan"
import { CoverageWeekdayStrip } from "@/features/coverage-plans/components/CoverageWeekdayStrip"
import { RejectCoveragePlanDialog } from "@/features/coverage-plans/components/RejectCoveragePlanDialog"
import {
  COVERAGE_PLAN_STATUSES,
  COVERAGE_PLAN_STATUS_LABELS,
  coverageTotalCustomers,
  formatCoverageDateRange,
  formatCoverageDateTime,
  formatCoverageRepeatRule,
  getCoveragePlanErrorMessage,
} from "@/features/coverage-plans/lib/coverage-plan.utils"
import type {
  CoveragePlan,
  CoveragePlanScope,
  CoveragePlanStatus,
} from "@/features/coverage-plans/api/coverage-plan.types"

const SCOPE_OPTIONS: { value: CoveragePlanScope; label: string }[] = [
  { value: "MINE", label: "My coverage plans" },
  { value: "TEAM", label: "Team coverage plans" },
]

const STATUS_OPTIONS: { value: "ALL" | CoveragePlanStatus; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  ...COVERAGE_PLAN_STATUSES.map((status) => ({
    value: status,
    label: COVERAGE_PLAN_STATUS_LABELS[status],
  })),
]

export default function CoveragePlansPage() {
  return (
    <RouteGate permission={PERMISSIONS.COVERAGE_PLAN.VIEW}>
      <CoveragePlansContent />
    </RouteGate>
  )
}

function CoveragePlansContent() {
  const router = useRouter()
  const companyUuid =
    useAuthStore((state) => state.session?.user?.companyUuid) ?? "current"
  const selfEmployeeUuid =
    useAuthStore((state) => state.session?.user?.employeeUuid) ?? null
  const { can } = usePermission()
  const canCreate = can("COVERAGE_PLAN", "CREATE")
  const canManage = can("COVERAGE_PLAN", "MANAGE")
  const canApprove = can("COVERAGE_PLAN", "APPROVE")
  const canCreateOrManage = canCreate || canManage
  const canSeeTeam = canManage || canApprove

  const [scope, setScope] = useState<CoveragePlanScope>("MINE")
  const [status, setStatus] = useState<"ALL" | CoveragePlanStatus>("ALL")
  const [from, setFrom] = useState<string | undefined>(undefined)
  const [to, setTo] = useState<string | undefined>(undefined)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)

  const [withdrawing, setWithdrawing] = useState<CoveragePlan | null>(null)
  const [resubmitting, setResubmitting] = useState<CoveragePlan | null>(null)
  const [approving, setApproving] = useState<CoveragePlan | null>(null)
  const [rejecting, setRejecting] = useState<CoveragePlan | null>(null)
  const [cancelling, setCancelling] = useState<CoveragePlan | null>(null)

  const effectiveScope = canSeeTeam ? scope : "MINE"
  const partialRange = !!from !== !!to
  const reversedRange = !!from && !!to && from > to
  const dateFilterError = partialRange
    ? "Select both the From and To dates to filter by date range."
    : reversedRange
      ? "From date must be on or before the To date."
      : null
  const rangeInvalid = partialRange || reversedRange

  const { data, isLoading, error, refetch } = useCoveragePlans(companyUuid, {
    scope: effectiveScope,
    status: status === "ALL" ? undefined : status,
    from: rangeInvalid ? undefined : from,
    to: rangeInvalid ? undefined : to,
    page,
    size,
  })

  const withdrawMutation = useWithdrawCoveragePlan(companyUuid)
  const resubmitMutation = useResubmitCoveragePlan(companyUuid)
  const approveMutation = useApproveCoveragePlan(companyUuid)
  const cancelMutation = useCancelCoveragePlan(companyUuid)

  const plans = data?.content ?? []
  const hasFilters =
    effectiveScope !== "MINE" || status !== "ALL" || !!from || !!to

  const clearFilters = () => {
    setScope("MINE")
    setStatus("ALL")
    setFrom(undefined)
    setTo(undefined)
    setPage(0)
  }

  const columns = useMemo<DataTableColumn<CoveragePlan>[]>(() => {
    return [
      {
        id: "date",
        header: "Coverage period",
        cell: ({ row }) => {
          const plan = row.original
          return (
            <span className="flex flex-col">
              <span className="font-medium whitespace-nowrap">
                {formatCoverageDateRange(plan.startDate, plan.endDate)}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatCoverageRepeatRule(plan.repeatRule, plan.endDate)}
              </span>
            </span>
          )
        },
      },
      {
        id: "employee",
        header: "Employee",
        cell: ({ row }) => (
          <EmployeeLabel
            companyUuid={companyUuid}
            employeeUuid={row.original.employeeUuid}
          />
        ),
      },
      {
        id: "weekdays",
        header: "Weekly coverage",
        cell: ({ row }) => {
          const plan = row.original
          return (
            <span className="flex flex-col gap-1">
              <CoverageWeekdayStrip plan={plan} />
              <span className="text-xs text-muted-foreground">
                {coverageTotalCustomers(plan)} customer assignment
                {coverageTotalCustomers(plan) === 1 ? "" : "s"}
              </span>
            </span>
          )
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const plan = row.original
          return (
            <span className="flex flex-col gap-1">
              <StatusBadge status={plan.status} />
              {plan.rejectReason ? (
                <span
                  className="max-w-48 truncate text-xs text-muted-foreground"
                  title={plan.rejectReason}
                >
                  {plan.rejectReason}
                </span>
              ) : null}
            </span>
          )
        },
      },
      {
        id: "updatedAt",
        header: "Last updated",
        cell: ({ row }) => (
          <span className="text-sm whitespace-nowrap text-muted-foreground">
            {formatCoverageDateTime(row.original.updatedAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const plan = row.original
          const pending = plan.status === "PENDING_APPROVAL"
          const approved = plan.status === "APPROVED"
          const resubmittable =
            plan.status === "REJECTED" || plan.status === "WITHDRAWN"
          const isOwner =
            !!selfEmployeeUuid && plan.employeeUuid === selfEmployeeUuid
          const employeeEditable = isOwner && resubmittable
          // Managers cannot manage their own plan; the backend denies it.
          const managerEditable = approved && !isOwner
          const canCancelPlan = (approved || pending) && !isOwner
          // The backend rejects self-approval, so never offer it.
          const canDecide = pending && !isOwner

          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Coverage plan actions"
                  />
                }
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto min-w-52">
                <DropdownMenuItem
                  onClick={() => router.push(`/coverage-plans/${plan.uuid}`)}
                >
                  <Eye className="mr-2 size-4" /> View details
                </DropdownMenuItem>

                {managerEditable ? (
                  <PermissionGate permission={PERMISSIONS.COVERAGE_PLAN.MANAGE}>
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(`/coverage-plans/${plan.uuid}/edit`)
                      }
                    >
                      <Pencil className="mr-2 size-4" /> Edit approved plan
                    </DropdownMenuItem>
                  </PermissionGate>
                ) : null}

                {employeeEditable ? (
                  <PermissionGate permission={PERMISSIONS.COVERAGE_PLAN.CREATE}>
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(`/coverage-plans/${plan.uuid}/edit`)
                      }
                    >
                      <Pencil className="mr-2 size-4" /> Edit & resubmit
                    </DropdownMenuItem>
                  </PermissionGate>
                ) : null}

                {isOwner && pending ? (
                  <PermissionGate permission={PERMISSIONS.COVERAGE_PLAN.CREATE}>
                    <DropdownMenuItem onClick={() => setWithdrawing(plan)}>
                      <Undo2 className="mr-2 size-4" /> Withdraw
                    </DropdownMenuItem>
                  </PermissionGate>
                ) : null}

                {employeeEditable ? (
                  <PermissionGate permission={PERMISSIONS.COVERAGE_PLAN.CREATE}>
                    <DropdownMenuItem onClick={() => setResubmitting(plan)}>
                      <RotateCcw className="mr-2 size-4" /> Resubmit
                    </DropdownMenuItem>
                  </PermissionGate>
                ) : null}

                {canDecide ? (
                  <PermissionGate
                    permission={PERMISSIONS.COVERAGE_PLAN.APPROVE}
                  >
                    <DropdownMenuSeparator />
                  </PermissionGate>
                ) : null}
                {canDecide ? (
                  <PermissionGate
                    permission={PERMISSIONS.COVERAGE_PLAN.APPROVE}
                  >
                    <DropdownMenuItem onClick={() => setApproving(plan)}>
                      <ShieldCheck className="mr-2 size-4" /> Approve
                    </DropdownMenuItem>
                  </PermissionGate>
                ) : null}
                {canDecide ? (
                  <PermissionGate
                    permission={PERMISSIONS.COVERAGE_PLAN.APPROVE}
                  >
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setRejecting(plan)}
                    >
                      <XCircle className="mr-2 size-4" /> Reject
                    </DropdownMenuItem>
                  </PermissionGate>
                ) : null}

                {canCancelPlan && canManage ? (
                  <>
                    <DropdownMenuSeparator />
                    <PermissionGate
                      permission={PERMISSIONS.COVERAGE_PLAN.MANAGE}
                    >
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setCancelling(plan)}
                      >
                        <Ban className="mr-2 size-4" /> Cancel plan
                      </DropdownMenuItem>
                    </PermissionGate>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ]
  }, [canManage, companyUuid, router, selfEmployeeUuid])

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Coverage Plans"
        description="Build recurring Monday–Saturday coverage templates and let approved plans generate visit plans automatically"
        action={
          <PermissionGate
            permissions={[
              PERMISSIONS.COVERAGE_PLAN.CREATE,
              PERMISSIONS.COVERAGE_PLAN.MANAGE,
            ]}
            require="any"
          >
            <Button onClick={() => router.push("/coverage-plans/new")}>
              <Plus className="mr-2 size-4" /> Create Coverage Plan
            </Button>
          </PermissionGate>
        }
      />

      <div
        role="note"
        className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground"
      >
        <Info className="mt-0.5 size-4 shrink-0" />
        <span>
          <span className="font-medium text-foreground">How it works:</span>{" "}
          choose weekdays and the active customers to cover. An employee
          submission waits for the direct manager; a manager or administrator
          creation is approved immediately. Holidays, weekly offs, inactive
          customers and dates that already have a manual visit plan are skipped
          automatically.
        </span>
      </div>

      <div className="grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap">
        {canSeeTeam ? (
          <div className="sm:w-52">
            <Select
              items={SCOPE_OPTIONS}
              value={scope}
              onValueChange={(value: string | null) => {
                if (value === "MINE" || value === "TEAM") {
                  setScope(value)
                  setPage(0)
                }
              }}
            >
              <SelectTrigger
                aria-label="Coverage plan scope"
                className="w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="p-2">
                {SCOPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="sm:w-48">
          <Select
            items={STATUS_OPTIONS}
            value={status}
            onValueChange={(value: string | null) => {
              if (value) {
                setStatus(value as "ALL" | CoveragePlanStatus)
                setPage(0)
              }
            }}
          >
            <SelectTrigger aria-label="Filter by status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="p-2">
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2 sm:w-72">
          <label htmlFor="coverage-plan-date-range" className="sr-only">
            Filter by coverage period
          </label>
          <DateRangePicker
            id="coverage-plan-date-range"
            value={{ from, to }}
            onValueChange={(range) => {
              setFrom(range.from)
              setTo(range.to)
              setPage(0)
            }}
            hasError={!!dateFilterError}
            placeholder="Filter by coverage period"
          />
        </div>

        {hasFilters ? (
          <Button
            variant="ghost"
            size="sm"
            className="justify-self-start"
            onClick={clearFilters}
          >
            <X className="mr-2 size-4" /> Clear filters
          </Button>
        ) : null}
      </div>

      {dateFilterError ? (
        <p
          role="alert"
          className="flex items-center gap-1.5 text-sm text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          {dateFilterError} Showing all dates until the range is valid.
        </p>
      ) : null}

      <DataTable
        columns={columns}
        data={plans}
        getRowId={(plan) => plan.uuid}
        isLoading={isLoading}
        error={error}
        errorMessage={getCoveragePlanErrorMessage(
          error,
          "Unable to load coverage plans"
        )}
        onRetry={() => void refetch()}
        empty={{
          icon: CalendarRange,
          title: "No coverage plans found",
          description: hasFilters
            ? "Try a different scope, status or coverage period."
            : canCreateOrManage
              ? "Create a repeating coverage template to generate visit plans automatically."
              : "No coverage plans have been created for you yet.",
          action:
            !hasFilters && canCreateOrManage ? (
              <PermissionGate
                permissions={[
                  PERMISSIONS.COVERAGE_PLAN.CREATE,
                  PERMISSIONS.COVERAGE_PLAN.MANAGE,
                ]}
                require="any"
              >
                <Button onClick={() => router.push("/coverage-plans/new")}>
                  <Plus className="mr-2 size-4" /> Create Coverage Plan
                </Button>
              </PermissionGate>
            ) : hasFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null,
        }}
        pagination={{
          page,
          totalPages: data?.totalPages ?? 0,
          totalElements: data?.totalElements,
          pageSize: size,
          onPageChange: setPage,
          onPageSizeChange: (nextSize) => {
            setSize(nextSize)
            setPage(0)
          },
        }}
      />

      <ConfirmDialog
        open={!!withdrawing}
        onOpenChange={(open) => !open && setWithdrawing(null)}
        title="Withdraw coverage plan?"
        description={
          withdrawing
            ? `The plan for ${formatCoverageDateRange(withdrawing.startDate, withdrawing.endDate)} will be withdrawn so the manager can no longer approve it. You can edit and resubmit it afterwards.`
            : undefined
        }
        confirmLabel="Withdraw"
        isLoading={withdrawMutation.isPending}
        onConfirm={() => {
          if (!withdrawing) return
          withdrawMutation.mutate(withdrawing.uuid, {
            onSuccess: () => {
              toast.success("Coverage plan withdrawn")
              setWithdrawing(null)
            },
            onError: (mutationError) =>
              toast.error(
                getCoveragePlanErrorMessage(
                  mutationError,
                  "Failed to withdraw coverage plan"
                )
              ),
          })
        }}
      />

      <ConfirmDialog
        open={!!resubmitting}
        onOpenChange={(open) => !open && setResubmitting(null)}
        title="Resubmit coverage plan?"
        description="The plan is sent back to the manager with its current dates, repeat rule and weekdays. Edit it first if it now starts in the past."
        confirmLabel="Resubmit"
        isLoading={resubmitMutation.isPending}
        onConfirm={() => {
          if (!resubmitting) return
          resubmitMutation.mutate(
            { planUuid: resubmitting.uuid },
            {
              onSuccess: () => {
                toast.success("Coverage plan resubmitted for approval")
                setResubmitting(null)
              },
              onError: (mutationError) =>
                toast.error(
                  getCoveragePlanErrorMessage(
                    mutationError,
                    "Failed to resubmit coverage plan"
                  )
                ),
            }
          )
        }}
      />

      <ConfirmDialog
        open={!!approving}
        onOpenChange={(open) => !open && setApproving(null)}
        title="Approve coverage plan?"
        description={
          approving
            ? `Approving ${formatCoverageDateRange(approving.startDate, approving.endDate)} generates a visit plan for every eligible covered date. Holidays, weekly offs, existing manual plans, inactive customers and customers outside the primary geography are skipped.`
            : undefined
        }
        confirmLabel="Approve & generate"
        isLoading={approveMutation.isPending}
        onConfirm={() => {
          if (!approving) return
          approveMutation.mutate(approving.uuid, {
            onSuccess: () => {
              toast.success("Coverage plan approved and visit plans generated")
              setApproving(null)
            },
            onError: (mutationError) =>
              toast.error(
                getCoveragePlanErrorMessage(
                  mutationError,
                  "Failed to approve coverage plan"
                )
              ),
          })
        }}
      />

      <ConfirmDialog
        open={!!cancelling}
        onOpenChange={(open) => !open && setCancelling(null)}
        title="Cancel coverage plan?"
        description="No further visit plans will be generated. Future generated plans that have not started are removed; past and started plans are kept. This cannot be undone."
        confirmLabel="Cancel plan"
        variant="destructive"
        isLoading={cancelMutation.isPending}
        onConfirm={() => {
          if (!cancelling) return
          cancelMutation.mutate(cancelling.uuid, {
            onSuccess: () => {
              toast.success("Coverage plan cancelled")
              setCancelling(null)
            },
            onError: (mutationError) =>
              toast.error(
                getCoveragePlanErrorMessage(
                  mutationError,
                  "Failed to cancel coverage plan"
                )
              ),
          })
        }}
      />

      <RejectCoveragePlanDialog
        companyUuid={companyUuid}
        plan={rejecting}
        open={!!rejecting}
        onOpenChange={(open) => !open && setRejecting(null)}
      />
    </div>
  )
}
