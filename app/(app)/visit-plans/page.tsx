"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  CalendarCheck2,
  Eye,
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
import { DatePicker } from "@/components/common/DatePicker"
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
import { ApproveVisitPlanDialog } from "@/features/visit-plans/components/ApproveVisitPlanDialog"
import { RejectVisitPlanDialog } from "@/features/visit-plans/components/RejectVisitPlanDialog"
import { EmployeeLabel } from "@/features/visit-plans/components/EmployeeLabel"
import { useVisitPlans } from "@/features/visit-plans/hooks/use-visit-plans"
import { useWithdrawVisitPlan } from "@/features/visit-plans/hooks/use-withdraw-visit-plan"
import { useResubmitVisitPlan } from "@/features/visit-plans/hooks/use-resubmit-visit-plan"
import {
  countActiveCustomers,
  countRemovedCustomers,
  formatVisitPlanDateRange,
  formatVisitPlanDateTime,
  getVisitPlanErrorMessage,
  VISIT_PLAN_STATUSES,
  VISIT_PLAN_STATUS_LABELS,
} from "@/features/visit-plans/lib/visit-plan.utils"
import type {
  VisitPlan,
  VisitPlanScope,
  VisitPlanStatus,
  VisitPlanType,
} from "@/features/visit-plans/api/visit-plan.types"

const SCOPE_OPTIONS: { value: VisitPlanScope; label: string }[] = [
  { value: "MINE", label: "My plans" },
  { value: "TEAM", label: "Team plans" },
]

const STATUS_OPTIONS: { value: "ALL" | VisitPlanStatus; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  ...VISIT_PLAN_STATUSES.map((status) => ({
    value: status,
    label: VISIT_PLAN_STATUS_LABELS[status],
  })),
]

const TYPE_OPTIONS: { value: "ALL" | VisitPlanType; label: string }[] = [
  { value: "ALL", label: "All plan types" },
  { value: "LOCAL", label: "Local" },
  { value: "OUTSTATION", label: "Outstation" },
]

export default function VisitPlansPage() {
  return (
    <RouteGate permission={PERMISSIONS.VISIT_PLAN.VIEW}>
      <VisitPlansContent />
    </RouteGate>
  )
}

function VisitPlansContent() {
  const router = useRouter()
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const selfEmployeeUuid =
    useAuthStore((s) => s.session?.user?.employeeUuid) ?? null
  const { can } = usePermission()
  const canCreate = can("VISIT_PLAN", "CREATE")

  const [scope, setScope] = useState<VisitPlanScope>("MINE")
  const [status, setStatus] = useState<"ALL" | VisitPlanStatus>("ALL")
  const [planType, setPlanType] = useState<"ALL" | VisitPlanType>("ALL")
  const [from, setFrom] = useState<string | undefined>(undefined)
  const [to, setTo] = useState<string | undefined>(undefined)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)

  const [withdrawing, setWithdrawing] = useState<VisitPlan | null>(null)
  const [resubmitting, setResubmitting] = useState<VisitPlan | null>(null)
  const [approving, setApproving] = useState<VisitPlan | null>(null)
  const [rejecting, setRejecting] = useState<VisitPlan | null>(null)

  const partialRange = !!from !== !!to
  const reversedRange = !!from && !!to && from > to
  const dateFilterError = partialRange
    ? "Select both the From and To dates to filter by date range."
    : reversedRange
      ? "From date must be on or before the To date."
      : null
  const rangeInvalid = partialRange || reversedRange

  const { data, isLoading, error, refetch } = useVisitPlans(companyUuid, {
    scope,
    status: status === "ALL" ? undefined : status,
    planType: planType === "ALL" ? undefined : planType,
    from: rangeInvalid ? undefined : from,
    to: rangeInvalid ? undefined : to,
    page,
    size,
  })

  const withdrawMutation = useWithdrawVisitPlan(companyUuid)
  const resubmitMutation = useResubmitVisitPlan(companyUuid)

  const plans = data?.content ?? []
  const hasFilters =
    scope !== "MINE" || status !== "ALL" || planType !== "ALL" || !!from || !!to

  const clearFilters = () => {
    setScope("MINE")
    setStatus("ALL")
    setPlanType("ALL")
    setFrom(undefined)
    setTo(undefined)
    setPage(0)
  }

  const columns = useMemo<DataTableColumn<VisitPlan>[]>(() => {
    return [
      {
        id: "date",
        header: "Plan date",
        cell: ({ row }) => {
          const plan = row.original
          return (
            <span className="flex flex-col">
              <span className="font-medium whitespace-nowrap">
                {formatVisitPlanDateRange(plan.fromDate, plan.toDate)}
              </span>
              <span className="text-xs text-muted-foreground">
                {plan.planType === "OUTSTATION" ? "Outstation" : "Local"}
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
        id: "customers",
        header: "Customers",
        cell: ({ row }) => {
          const plan = row.original
          const active = countActiveCustomers(plan)
          const removed = countRemovedCustomers(plan)
          return (
            <span className="flex flex-col text-sm">
              <span>{active} active</span>
              {removed > 0 ? (
                <span className="text-xs text-muted-foreground">
                  {removed} removed by approver
                </span>
              ) : null}
            </span>
          )
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <span className="flex flex-col gap-1">
            <StatusBadge status={row.original.status} />
            {row.original.reason ? (
              <span
                className="max-w-48 truncate text-xs text-muted-foreground"
                title={row.original.reason}
              >
                {row.original.reason}
              </span>
            ) : null}
          </span>
        ),
      },
      {
        id: "updatedAt",
        header: "Last updated",
        cell: ({ row }) => (
          <span className="text-sm whitespace-nowrap text-muted-foreground">
            {formatVisitPlanDateTime(row.original.updatedAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const plan = row.original
          const pending = plan.status === "PENDING_APPROVAL"
          const isOwner =
            !!selfEmployeeUuid && plan.employeeUuid === selfEmployeeUuid
          const employeeEditable =
            isOwner &&
            (plan.status === "REJECTED" || plan.status === "WITHDRAWN")
          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Visit plan actions"
                  />
                }
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto min-w-48">
                <DropdownMenuItem
                  onClick={() => router.push(`/visit-plans/${plan.uuid}`)}
                >
                  <Eye className="mr-2 size-4" /> View details
                </DropdownMenuItem>

                <PermissionGate permission={PERMISSIONS.VISIT_PLAN.MANAGE}>
                  <DropdownMenuItem
                    disabled={plan.status !== "APPROVED"}
                    onClick={() =>
                      router.push(`/visit-plans/${plan.uuid}/edit`)
                    }
                  >
                    <Pencil className="mr-2 size-4" /> Edit approved plan
                  </DropdownMenuItem>
                </PermissionGate>
                {employeeEditable ? (
                  <PermissionGate permission={PERMISSIONS.VISIT_PLAN.CREATE}>
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(`/visit-plans/${plan.uuid}/edit`)
                      }
                    >
                      <Pencil className="mr-2 size-4" /> Edit & resubmit
                    </DropdownMenuItem>
                  </PermissionGate>
                ) : null}

                {isOwner ? (
                  <>
                    <DropdownMenuSeparator />
                    <PermissionGate permission={PERMISSIONS.VISIT_PLAN.CREATE}>
                      <DropdownMenuItem
                        disabled={!pending}
                        onClick={() => setWithdrawing(plan)}
                      >
                        <Undo2 className="mr-2 size-4" /> Withdraw
                      </DropdownMenuItem>
                    </PermissionGate>
                    <PermissionGate permission={PERMISSIONS.VISIT_PLAN.CREATE}>
                      <DropdownMenuItem
                        disabled={!employeeEditable}
                        onClick={() => setResubmitting(plan)}
                      >
                        <RotateCcw className="mr-2 size-4" /> Resubmit
                      </DropdownMenuItem>
                    </PermissionGate>
                  </>
                ) : null}

                <PermissionGate permission={PERMISSIONS.VISIT_PLAN.APPROVE}>
                  <DropdownMenuSeparator />
                </PermissionGate>
                <PermissionGate permission={PERMISSIONS.VISIT_PLAN.APPROVE}>
                  <DropdownMenuItem
                    disabled={!pending}
                    onClick={() => setApproving(plan)}
                  >
                    <ShieldCheck className="mr-2 size-4" /> Approve
                  </DropdownMenuItem>
                </PermissionGate>
                <PermissionGate permission={PERMISSIONS.VISIT_PLAN.APPROVE}>
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={!pending}
                    onClick={() => setRejecting(plan)}
                  >
                    <XCircle className="mr-2 size-4" /> Reject
                  </DropdownMenuItem>
                </PermissionGate>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ]
  }, [companyUuid, selfEmployeeUuid, router])

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Visit Plans"
        description="Plan customer visits, submit them for approval and review your team's plans"
        action={
          <PermissionGate permission={PERMISSIONS.VISIT_PLAN.CREATE}>
            <Button onClick={() => router.push("/visit-plans/new")}>
              <Plus className="mr-2 size-4" /> Create Visit Plan
            </Button>
          </PermissionGate>
        }
      />

      <div className="grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap">
        <div className="sm:w-40">
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
            <SelectTrigger aria-label="Plan scope" className="w-full">
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

        <div className="sm:w-48">
          <Select
            items={STATUS_OPTIONS}
            value={status}
            onValueChange={(value: string | null) => {
              if (value) {
                setStatus(value as "ALL" | VisitPlanStatus)
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

        <div className="sm:w-44">
          <Select
            items={TYPE_OPTIONS}
            value={planType}
            onValueChange={(value: string | null) => {
              if (value) {
                setPlanType(value as "ALL" | VisitPlanType)
                setPage(0)
              }
            }}
          >
            <SelectTrigger aria-label="Filter by plan type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="p-2">
              {TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="sm:w-44">
          <DatePicker
            value={from}
            onValueChange={(value) => {
              setFrom(value)
              setPage(0)
            }}
            hasError={!!dateFilterError}
            placeholder="From date"
          />
        </div>
        <div className="sm:w-44">
          <DatePicker
            value={to}
            onValueChange={(value) => {
              setTo(value)
              setPage(0)
            }}
            hasError={!!dateFilterError}
            placeholder="To date"
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
        onRetry={() => void refetch()}
        empty={{
          icon: CalendarCheck2,
          title: "No visit plans found",
          description: hasFilters
            ? "Try a different scope, status, plan type or date range."
            : canCreate
              ? "Create a plan to schedule customer visits."
              : "No visit plans have been created for you yet.",
          action:
            !hasFilters && canCreate ? (
              <PermissionGate permission={PERMISSIONS.VISIT_PLAN.CREATE}>
                <Button onClick={() => router.push("/visit-plans/new")}>
                  <Plus className="mr-2 size-4" /> Create Visit Plan
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
        title="Withdraw visit plan?"
        description={
          withdrawing
            ? `The plan for ${formatVisitPlanDateRange(withdrawing.fromDate, withdrawing.toDate)} will be withdrawn so the manager can no longer approve it. You can edit and resubmit it afterwards.`
            : undefined
        }
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
