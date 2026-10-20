"use client"

import { useMemo } from "react"

import { usePermission } from "@/hooks/use-permission"
import { useAuthStore } from "@/stores/auth-store"
import type { VisitPlan } from "../api/visit-plan.types"

export type VisitPlanCapabilities = {
  canView: boolean
  canCreate: boolean
  canManage: boolean
  canApprove: boolean
  /** True when the plan belongs to the signed-in user's employee record. */
  isOwnPlan: boolean
  /**
   * APPROVED plans are editable by a manager (VISIT_PLAN_MANAGE);
   * REJECTED/WITHDRAWN plans by the owning employee (VISIT_PLAN_CREATE).
   */
  canEdit: boolean
  /** The owning employee may withdraw a PENDING_APPROVAL plan. */
  canWithdraw: boolean
  /** The owning employee may resubmit a REJECTED/WITHDRAWN plan. */
  canResubmit: boolean
  /** Approve/reject only apply to PENDING_APPROVAL plans. */
  canDecide: boolean
}

/**
 * UI capability matrix for a single plan. The backend remains the source of
 * truth (ownership and direct-manager relationships are re-checked there);
 * these flags only drive visibility of the actions.
 */
export function useVisitPlanCapabilities(
  plan?: Pick<VisitPlan, "status" | "employeeUuid"> | null
): VisitPlanCapabilities {
  const { can } = usePermission()
  const selfEmployeeUuid =
    useAuthStore((state) => state.session?.user?.employeeUuid) ?? null

  return useMemo(() => {
    const canView = can("VISIT_PLAN", "VIEW")
    const canCreate = can("VISIT_PLAN", "CREATE")
    const canManage = can("VISIT_PLAN", "MANAGE")
    const canApprove = can("VISIT_PLAN", "APPROVE")
    const status = plan?.status
    const pending = status === "PENDING_APPROVAL"
    const isOwnPlan =
      !!selfEmployeeUuid && plan?.employeeUuid === selfEmployeeUuid
    const editableByEmployee =
      (status === "REJECTED" || status === "WITHDRAWN") && isOwnPlan

    return {
      canView,
      canCreate,
      canManage,
      canApprove,
      isOwnPlan,
      canEdit:
        (status === "APPROVED" && canManage) ||
        (editableByEmployee && canCreate),
      canWithdraw: pending && isOwnPlan && canCreate,
      canResubmit: editableByEmployee && canCreate,
      canDecide: pending && canApprove,
    }
  }, [plan?.status, plan?.employeeUuid, selfEmployeeUuid, can])
}
