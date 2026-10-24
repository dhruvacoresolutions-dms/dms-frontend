"use client"

import { useMemo } from "react"

import { usePermission } from "@/hooks/use-permission"
import { useAuthStore } from "@/stores/auth-store"
import type { CoveragePlan } from "../api/coverage-plan.types"

export type CoveragePlanCapabilities = {
  canView: boolean
  canCreate: boolean
  canManage: boolean
  canApprove: boolean
  /** True when the plan belongs to the signed-in user's employee record. */
  isOwnPlan: boolean
  /**
   * APPROVED plans are editable by a manager (COVERAGE_PLAN_MANAGE) other than
   * the owner; REJECTED/WITHDRAWN plans by the owning employee
   * (COVERAGE_PLAN_CREATE). Managers cannot manage their own plan.
   */
  canEdit: boolean
  /** The owning employee may withdraw a PENDING_APPROVAL plan. */
  canWithdraw: boolean
  /** The owning employee may resubmit a REJECTED/WITHDRAWN plan. */
  canResubmit: boolean
  /** PENDING_APPROVAL plans the caller did not submit themselves. */
  canDecide: boolean
  /** A manager may stop another employee's APPROVED or PENDING_APPROVAL plan. */
  canCancel: boolean
}

/**
 * UI capability matrix for a single coverage plan. The backend remains the
 * source of truth (ownership and direct-manager relationships are re-checked
 * there); these flags only drive visibility of the actions.
 */
export function useCoveragePlanCapabilities(
  plan?: Pick<CoveragePlan, "status" | "employeeUuid"> | null
): CoveragePlanCapabilities {
  const { can } = usePermission()
  const selfEmployeeUuid =
    useAuthStore((state) => state.session?.user?.employeeUuid) ?? null

  return useMemo(() => {
    const isOwnPlan =
      !!selfEmployeeUuid && plan?.employeeUuid === selfEmployeeUuid
    const status = plan?.status
    const canCreate = can("COVERAGE_PLAN", "CREATE")
    const canManage = can("COVERAGE_PLAN", "MANAGE")
    const canApprove = can("COVERAGE_PLAN", "APPROVE")

    return {
      canView: can("COVERAGE_PLAN", "VIEW"),
      canCreate,
      canManage,
      canApprove,
      isOwnPlan,
      canEdit:
        status === "APPROVED"
          ? canManage && !isOwnPlan
          : (status === "REJECTED" || status === "WITHDRAWN") &&
            isOwnPlan &&
            canCreate,
      canWithdraw: status === "PENDING_APPROVAL" && isOwnPlan && canCreate,
      canResubmit:
        (status === "REJECTED" || status === "WITHDRAWN") &&
        isOwnPlan &&
        canCreate,
      canDecide: status === "PENDING_APPROVAL" && canApprove && !isOwnPlan,
      canCancel:
        (status === "APPROVED" || status === "PENDING_APPROVAL") &&
        canManage &&
        !isOwnPlan,
    }
  }, [can, plan?.employeeUuid, plan?.status, selfEmployeeUuid])
}
