import { AxiosError, type AxiosResponse } from "axios"
import { describe, expect, it } from "vitest"

import type {
  CoveragePlan,
  CoveragePlanRequest,
} from "../api/coverage-plan.types"
import {
  buildCoverageLines,
  coverageRequestFromPlan,
  coverageServerFieldPath,
  coverageSpanDays,
  coverageWeeksEndDate,
  coverageWeekdayCount,
  coverageWeekdayCounts,
  effectiveCoverageEndDate,
  formatCoverageDateRange,
  formatCoverageRepeatRule,
  getCoveragePlanErrorMessage,
  isCoveragePlanOverlapError,
  isCoverageSpanValid,
  maxCoverageRepeatValue,
} from "./coverage-plan.utils"

const plan: CoveragePlan = {
  uuid: "11111111-1111-1111-1111-111111111111",
  employeeUuid: "22222222-2222-2222-2222-222222222222",
  startDate: "2026-10-26",
  endDate: "2026-11-22",
  repeatRule: { type: "N_WEEKS", value: 4 },
  status: "APPROVED",
  source: "MANAGER",
  rejectReason: null,
  lines: [
    { weekday: "MON", customerUuids: ["a", "b"] },
    { weekday: "WED", customerUuids: ["c"] },
  ],
  createdAt: "2026-10-25T10:00:00Z",
  updatedAt: "2026-10-25T10:00:00Z",
}

function validationError(input: {
  code: string
  message: string
  field: string
  fieldMessage: string
  status?: number
}) {
  const response = {
    data: {
      success: false,
      code: input.code,
      message: input.message,
      correlationId: null,
      errors: [{ field: input.field, message: input.fieldMessage }],
      timestamp: "2026-10-25T10:00:00Z",
    },
    status: input.status ?? 400,
    statusText: "Bad Request",
    headers: {},
    config: {},
  } as AxiosResponse

  return new AxiosError(
    "Request failed",
    "ERR_BAD_REQUEST",
    undefined,
    undefined,
    response
  )
}

describe("coverage plan dates", () => {
  it("counts inclusive calendar days", () => {
    expect(coverageSpanDays("2026-10-26", "2026-10-26")).toBe(1)
    expect(coverageSpanDays("2026-10-26", "2026-11-25")).toBe(31)
    expect(coverageSpanDays("2026-11-25", "2026-10-26")).toBe(0)
    expect(coverageSpanDays(undefined, "2026-10-26")).toBe(0)
  })

  it("enforces the backend 1..92-day span", () => {
    expect(isCoverageSpanValid("2026-01-01", "2026-01-01")).toBe(true)
    expect(isCoverageSpanValid("2026-01-01", "2026-04-02")).toBe(true)
    expect(isCoverageSpanValid("2026-01-01", "2026-04-03")).toBe(false)
  })

  it("computes an N_WEEKS end date inclusively", () => {
    expect(coverageWeeksEndDate("2026-10-26", 1)).toBe("2026-11-01")
    expect(coverageWeeksEndDate("2026-10-26", 4)).toBe("2026-11-22")
    expect(coverageWeeksEndDate("2026-10-26", 13)).toBe("2027-01-24")
    expect(coverageWeeksEndDate("2026-10-26", 0)).toBe("")
  })

  it("returns a server-calculated end date for N_PERIODS", () => {
    expect(
      effectiveCoverageEndDate({
        startDate: "2026-10-26",
        repeatType: "TILL_DATE",
        endDate: "2026-11-20",
      })
    ).toBe("2026-11-20")
    expect(
      effectiveCoverageEndDate({
        startDate: "2026-10-26",
        repeatType: "N_WEEKS",
        value: 4,
      })
    ).toBe("2026-11-22")
    expect(
      effectiveCoverageEndDate({
        startDate: "2026-10-26",
        repeatType: "N_PERIODS",
        value: 2,
      })
    ).toBeNull()
  })

  it("caps weeks at 13 and periods at the backend value", () => {
    expect(maxCoverageRepeatValue("N_WEEKS")).toBe(13)
    expect(maxCoverageRepeatValue("N_PERIODS")).toBe(92)
    expect(maxCoverageRepeatValue("TILL_DATE")).toBe(0)
  })

  it("formats date ranges and repeat rules", () => {
    expect(formatCoverageDateRange("2026-10-26", "2026-11-22")).toBe(
      "26 Oct 2026 – 22 Nov 2026"
    )
    expect(formatCoverageDateRange("2026-10-26", "2026-10-26")).toBe(
      "26 Oct 2026"
    )
    expect(formatCoverageRepeatRule(plan.repeatRule, plan.endDate)).toBe(
      "4 weeks"
    )
    expect(
      formatCoverageRepeatRule({ type: "TILL_DATE", value: null }, plan.endDate)
    ).toBe("Until 22 Nov 2026")
    expect(
      formatCoverageRepeatRule({ type: "N_PERIODS", value: 2 }, plan.endDate)
    ).toBe("2 accounting periods")
  })
})

describe("coverage plan lines", () => {
  it("orders weekdays, drops empty lines and removes duplicate customers", () => {
    expect(
      buildCoverageLines([
        { weekday: "WED", customerUuids: ["c"] },
        { weekday: "MON", customerUuids: ["a", "a", "b"] },
        { weekday: "TUE", customerUuids: [], included: true },
        { weekday: "THU", customerUuids: ["d"], included: false },
      ])
    ).toEqual([
      { weekday: "MON", customerUuids: ["a", "b"] },
      { weekday: "WED", customerUuids: ["c"] },
    ])
  })

  it("counts weekdays and customers", () => {
    expect(coverageWeekdayCount(plan)).toBe(2)
    expect(coverageWeekdayCounts(plan)).toEqual({
      MON: 2,
      TUE: 0,
      WED: 1,
      THU: 0,
      FRI: 0,
      SAT: 0,
    })
  })

  it("builds an independent edit payload from a plan", () => {
    const request: CoveragePlanRequest = coverageRequestFromPlan(plan)
    expect(request).toEqual({
      employeeUuid: plan.employeeUuid,
      startDate: plan.startDate,
      endDate: plan.endDate,
      repeatRule: plan.repeatRule,
      lines: plan.lines,
    })
    expect(request.lines).not.toBe(plan.lines)
    expect(request.lines[0].customerUuids).not.toBe(plan.lines[0].customerUuids)
  })

  it("maps server field paths", () => {
    expect(coverageServerFieldPath("employeeUuid")).toBe("employeeUuid")
    expect(coverageServerFieldPath("repeatRule.value")).toBe("repeatValue")
    expect(coverageServerFieldPath("lines[3].customerUuids")).toBe(
      "lines.3.customerUuids"
    )
    expect(coverageServerFieldPath("lines[3].weekday")).toBeNull()
    expect(coverageServerFieldPath("primaryGeographyUuid")).toBeNull()
  })
})

describe("coverage plan errors", () => {
  it("detects the deployed 400 repeatRule overlap shape", () => {
    const error = validationError({
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      field: "repeatRule",
      fieldMessage:
        "An active coverage plan already exists from 2026-10-26 to 2026-11-22",
    })

    expect(isCoveragePlanOverlapError(error)).toBe(true)
    expect(getCoveragePlanErrorMessage(error, "fallback")).toContain(
      "active coverage plan already exists"
    )
  })

  it("detects the published 409 overlap contract", () => {
    const error = validationError({
      code: "COVERAGE_PLAN_OVERLAP",
      message: "An active coverage plan already exists",
      field: "employeeUuid",
      fieldMessage: "An active coverage plan already exists for this period",
      status: 409,
    })

    expect(isCoveragePlanOverlapError(error)).toBe(true)
    expect(getCoveragePlanErrorMessage(error, "fallback")).toBe(
      "An active coverage plan already exists for this period"
    )
  })

  it("falls back to the envelope message for other errors", () => {
    const error = validationError({
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      field: "startDate",
      fieldMessage: "Date must be tomorrow or later",
    })

    expect(isCoveragePlanOverlapError(error)).toBe(false)
    expect(getCoveragePlanErrorMessage(error, "fallback")).toBe(
      "Date must be tomorrow or later"
    )
  })

  it("uses the caller fallback for unknown errors", () => {
    expect(getCoveragePlanErrorMessage(new Error("boom"), "Try again")).toBe(
      "Try again"
    )
  })
})
