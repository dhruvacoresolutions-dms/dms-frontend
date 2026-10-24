"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Controller, useForm, useWatch, type Path } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  AlertCircle,
  CalendarRange,
  CheckCircle2,
  Info,
  ListChecks,
  UsersRound,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FormDateField,
  FormNumberField,
  requiredLabel,
} from "@/components/common/form-fields"
import { EmployeeCombobox } from "@/features/employees/components/EmployeeCombobox"
import { useEmployeeGeographies } from "@/features/employees/hooks/use-employee-geographies"
import { useGeography } from "@/features/geographies/hooks/use-geography"
import { EmployeeLabel } from "@/features/visit-plans/components/EmployeeLabel"
import { useAuthStore } from "@/stores/auth-store"
import { usePermission } from "@/hooks/use-permission"
import { cn } from "@/lib/utils"
import { useCreateCoveragePlan } from "../hooks/use-create-coverage-plan"
import { useUpdateCoveragePlan } from "../hooks/use-update-coverage-plan"
import { useResubmitCoveragePlan } from "../hooks/use-resubmit-coverage-plan"
import {
  COVERAGE_REPEAT_TYPES,
  COVERAGE_REPEAT_TYPE_LABELS,
  COVERAGE_WEEKDAYS,
  COVERAGE_WEEKDAY_LABELS,
  MAX_COVERAGE_SPAN_DAYS,
  buildCoverageLines,
  coverageServerFieldPath,
  coverageSpanDays,
  coverageWeeksEndDate,
  effectiveCoverageEndDate,
  formatCoverageDate,
  formatCoverageDateRange,
  formatCoverageRepeatRule,
  getCoveragePlanErrorMessage,
  getCoveragePlanFieldErrors,
  isCoveragePlanOverlapError,
  isCoverageSpanValid,
  maxCoverageRepeatValue,
  tomorrowIso,
  todayIso,
} from "../lib/coverage-plan.utils"
import type {
  CoveragePlan,
  CoveragePlanRequest,
  CoverageRepeatType,
  CoverageWeekday,
} from "../api/coverage-plan.types"
import { CoverageWeekdayEditor } from "./CoverageWeekdayEditor"

const REPEAT_TYPE_ITEMS = COVERAGE_REPEAT_TYPES.map((type) => ({
  value: type,
  label: COVERAGE_REPEAT_TYPE_LABELS[type],
}))

type CoverageLineFormValue = {
  weekday: CoverageWeekday
  included: boolean
  customerUuids: string[]
}

type CoveragePlanFormValues = {
  employeeUuid: string
  startDate: string
  repeatType: CoverageRepeatType
  endDate: string
  repeatValue: string
  lines: CoverageLineFormValue[]
}

type CoveragePlanFormProps = {
  companyUuid: string
  /** Existing plan (edit mode). Omit to create. */
  plan?: CoveragePlan
  onDone: (saved: CoveragePlan) => void
  onCancel?: () => void
}

function emptyLines(): CoverageLineFormValue[] {
  return COVERAGE_WEEKDAYS.map((weekday) => ({
    weekday,
    included: false,
    customerUuids: [],
  }))
}

function initialValues(
  plan: CoveragePlan | undefined,
  selfEmployeeUuid: string | null
): CoveragePlanFormValues {
  if (!plan) {
    return {
      employeeUuid: selfEmployeeUuid ?? "",
      startDate: tomorrowIso(),
      repeatType: "TILL_DATE",
      endDate: "",
      repeatValue: "",
      lines: emptyLines(),
    }
  }

  const byWeekday = new Map(
    plan.lines.map((line) => [line.weekday, line.customerUuids] as const)
  )

  return {
    employeeUuid: plan.employeeUuid,
    startDate: plan.startDate,
    repeatType: plan.repeatRule.type,
    endDate: plan.repeatRule.type === "TILL_DATE" ? plan.endDate : "",
    repeatValue:
      plan.repeatRule.value === null ? "" : String(plan.repeatRule.value),
    lines: COVERAGE_WEEKDAYS.map((weekday) => {
      const customerUuids = byWeekday.get(weekday) ?? []
      return {
        weekday,
        included: customerUuids.length > 0,
        customerUuids: [...customerUuids],
      }
    }),
  }
}

function buildSchema() {
  return z
    .object({
      employeeUuid: z.string(),
      startDate: z.string(),
      repeatType: z.enum(["TILL_DATE", "N_WEEKS", "N_PERIODS"]),
      endDate: z.string(),
      repeatValue: z.string(),
      lines: z.array(
        z.object({
          weekday: z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT"]),
          included: z.boolean(),
          customerUuids: z.array(z.string()),
        })
      ),
    })
    .superRefine((values, ctx) => {
      const issue = (path: (string | number)[], message: string) =>
        ctx.addIssue({ code: z.ZodIssueCode.custom, path, message })

      if (!values.employeeUuid) {
        issue(["employeeUuid"], "Select the employee this plan belongs to")
      }

      if (!values.startDate) {
        issue(["startDate"], "Start date is required")
      }

      if (values.repeatType === "TILL_DATE") {
        if (!values.endDate) {
          issue(["endDate"], "End date is required")
        } else if (values.startDate && values.endDate < values.startDate) {
          issue(["endDate"], "End date must be on or after the start date")
        } else if (
          values.startDate &&
          !isCoverageSpanValid(values.startDate, values.endDate)
        ) {
          issue(
            ["endDate"],
            `Coverage must span 1..${MAX_COVERAGE_SPAN_DAYS} days inclusive`
          )
        }
      } else {
        const maximum = maxCoverageRepeatValue(values.repeatType)
        const raw = values.repeatValue.trim()
        const repeatValue = Number(raw)
        if (!raw) {
          issue(
            ["repeatValue"],
            values.repeatType === "N_WEEKS"
              ? "Number of weeks is required"
              : "Number of accounting periods is required"
          )
        } else if (!Number.isInteger(repeatValue) || repeatValue < 1) {
          issue(["repeatValue"], "Enter a whole number of at least 1")
        } else if (repeatValue > maximum) {
          issue(["repeatValue"], `Value must be between 1 and ${maximum}`)
        } else if (values.repeatType === "N_WEEKS" && values.startDate) {
          const end = coverageWeeksEndDate(values.startDate, repeatValue)
          if (!isCoverageSpanValid(values.startDate, end)) {
            issue(
              ["repeatValue"],
              `Coverage must span 1..${MAX_COVERAGE_SPAN_DAYS} days inclusive; reduce the number of weeks`
            )
          }
        }
      }

      const included = values.lines.filter((line) => line.included)
      if (included.length === 0) {
        issue(
          ["lines"],
          "Include at least one weekday and select its customers"
        )
      }

      values.lines.forEach((line, index) => {
        if (!line.included) return
        const label = COVERAGE_WEEKDAY_LABELS[line.weekday]
        if (line.customerUuids.length === 0) {
          issue(
            ["lines", index, "customerUuids"],
            `Select at least one customer for ${label}`
          )
        } else if (line.customerUuids.length > 200) {
          issue(
            ["lines", index, "customerUuids"],
            `Select at most 200 customers for ${label}`
          )
        } else if (
          new Set(line.customerUuids).size !== line.customerUuids.length
        ) {
          issue(
            ["lines", index, "customerUuids"],
            `Each customer must occur once on ${label}`
          )
        }
      })
    })
}

function SummaryRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="min-w-0 text-right text-sm">{children}</dd>
    </div>
  )
}

/**
 * Create/edit builder for a recurring Monday–Saturday coverage template.
 * Mirrors `CoverageService.template/end/validate` so the common validation
 * failures are caught before the request; the server remains authoritative.
 */
export function CoveragePlanForm({
  companyUuid,
  plan,
  onDone,
  onCancel,
}: CoveragePlanFormProps) {
  const isEdit = !!plan
  const selfEmployeeUuid =
    useAuthStore((state) => state.session?.user?.employeeUuid) ?? null
  const { can } = usePermission()
  const canCreate = can("COVERAGE_PLAN", "CREATE")
  const canManage = can("COVERAGE_PLAN", "MANAGE")
  const canViewGeographies = can("GEOGRAPHY", "VIEW")
  const manageOnly = !canCreate && canManage

  const approvedEdit = isEdit && plan?.status === "APPROVED"
  const resubmittableEdit =
    isEdit && (plan?.status === "REJECTED" || plan?.status === "WITHDRAWN")

  const [formError, setFormError] = useState<string | null>(null)

  const defaultValues = useMemo(
    () => initialValues(plan, selfEmployeeUuid),
    [plan, selfEmployeeUuid]
  )

  const schema = useMemo(() => buildSchema(), [])

  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<CoveragePlanFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onBlur",
  })

  const watchedEmployeeUuid = useWatch({ control, name: "employeeUuid" }) ?? ""
  const startDate = useWatch({ control, name: "startDate" }) ?? ""
  const repeatType = useWatch({ control, name: "repeatType" }) ?? "TILL_DATE"
  const endDate = useWatch({ control, name: "endDate" }) ?? ""
  const repeatValue = useWatch({ control, name: "repeatValue" }) ?? ""
  const lines = useWatch({ control, name: "lines" }) ?? []

  const selectedEmployeeUuid = watchedEmployeeUuid
  const isSelfTarget =
    !!selfEmployeeUuid && watchedEmployeeUuid === selfEmployeeUuid
  const requiresTomorrow = isEdit ? !approvedEdit : isSelfTarget
  const allowPastStart = approvedEdit && !!plan && startDate === plan.startDate

  const geographiesQuery = useEmployeeGeographies(
    companyUuid,
    selectedEmployeeUuid
  )
  const primaryGeography = useMemo(
    () =>
      geographiesQuery.data?.find((geography) => geography.primaryAssignment) ??
      null,
    [geographiesQuery.data]
  )
  // Customers are scoped to TERRITORY nodes. A BEAT primary assignment is
  // valid, but its containing territory is not on the employee geography row,
  // so resolve one level up only when needed.
  const primaryGeographyQuery = useGeography(
    companyUuid,
    canViewGeographies && primaryGeography?.geographyType === "BEAT"
      ? primaryGeography.geographyUuid
      : ""
  )
  const primaryTerritoryUuid =
    primaryGeography?.geographyType === "TERRITORY"
      ? primaryGeography.geographyUuid
      : primaryGeographyQuery.data?.parentType === "TERRITORY"
        ? (primaryGeographyQuery.data.parentUuid ?? undefined)
        : undefined

  const createMutation = useCreateCoveragePlan(companyUuid)
  const updateMutation = useUpdateCoveragePlan(companyUuid)
  const resubmitMutation = useResubmitCoveragePlan(companyUuid)
  const isSubmitting =
    createMutation.isPending ||
    updateMutation.isPending ||
    resubmitMutation.isPending

  const repeatValueNumber =
    repeatValue.trim() === "" ? null : Number(repeatValue)
  const effectiveEnd = effectiveCoverageEndDate({
    startDate,
    repeatType,
    endDate,
    value:
      repeatValueNumber !== null && Number.isFinite(repeatValueNumber)
        ? repeatValueNumber
        : null,
  })
  const spanDays = effectiveEnd ? coverageSpanDays(startDate, effectiveEnd) : 0
  const spanValid = effectiveEnd
    ? isCoverageSpanValid(startDate, effectiveEnd)
    : null

  const includedLines = lines.filter(
    (line) => line.included && line.customerUuids.length > 0
  )
  const includedCount = lines.filter((line) => line.included).length
  const totalCustomers = includedLines.reduce(
    (total, line) => total + line.customerUuids.length,
    0
  )

  const missingEmployee = !selectedEmployeeUuid
  // Manage-only access cannot create a self submission. Editing an existing
  // plan keeps its fixed employee, so this rule only applies to creation.
  const manageOnlyInvalid =
    !isEdit &&
    manageOnly &&
    !!selectedEmployeeUuid &&
    selectedEmployeeUuid === selfEmployeeUuid
  const missingPrimaryGeography =
    geographiesQuery.isSuccess && !primaryGeography
  const disableSubmit =
    isSubmitting ||
    missingEmployee ||
    manageOnlyInvalid ||
    missingPrimaryGeography

  const previousEmployee = useRef(selectedEmployeeUuid)

  // Changing or clearing the employee invalidates every customer selection.
  useEffect(() => {
    if (isEdit) return
    if (previousEmployee.current !== selectedEmployeeUuid) {
      setValue("lines", emptyLines(), { shouldDirty: true })
      clearErrors("lines")
    }
    previousEmployee.current = selectedEmployeeUuid
  }, [clearErrors, isEdit, selectedEmployeeUuid, setValue])

  // Hydrated auth session: fill the self employee lazily.
  useEffect(() => {
    if (isEdit || getValues("employeeUuid") || !selfEmployeeUuid) return
    setValue("employeeUuid", selfEmployeeUuid)
  }, [getValues, setValue, isEdit, selfEmployeeUuid])

  const lineError = (index: number): string | undefined => {
    const lineErrors = errors.lines as unknown as
      Array<{ customerUuids?: { message?: string } }> | undefined
    return lineErrors?.[index]?.customerUuids?.message
  }

  const linesRootError = (
    errors.lines as unknown as { message?: string } | undefined
  )?.message

  const mapServerFieldPath = (
    field: string,
    payloadLines: ReturnType<typeof buildCoverageLines>
  ): Path<CoveragePlanFormValues> | null => {
    const direct = coverageServerFieldPath(field)
    if (!direct) return null
    if (!direct.startsWith("lines.")) {
      return direct as Path<CoveragePlanFormValues>
    }

    const payloadIndex = Number(direct.split(".")[1])
    const weekday = payloadLines[payloadIndex]?.weekday
    if (!weekday) return null
    const formIndex = COVERAGE_WEEKDAYS.indexOf(weekday)
    if (formIndex < 0) return null
    return `lines.${formIndex}.customerUuids` as Path<CoveragePlanFormValues>
  }

  const setLine = (index: number, patch: Partial<CoverageLineFormValue>) => {
    setFormError(null)
    const next = lines.map((line, lineIndex) =>
      lineIndex === index ? { ...line, ...patch } : line
    )
    setValue("lines", next, { shouldDirty: true })
    clearErrors(["lines", `lines.${index}.customerUuids`])
  }

  const handleError = (
    error: unknown,
    fallback: string,
    payloadLines: ReturnType<typeof buildCoverageLines>
  ) => {
    const overlap = isCoveragePlanOverlapError(error)
    let applied = false
    if (!overlap) {
      for (const detail of getCoveragePlanFieldErrors(error)) {
        if (!detail?.field || !detail.message) continue
        const path = mapServerFieldPath(detail.field, payloadLines)
        if (!path) continue
        setError(path, { type: "server", message: detail.message })
        applied = true
      }
    }

    const message = getCoveragePlanErrorMessage(error, fallback)
    if (!applied || overlap) {
      setFormError(message)
    }
    toast.error(message)
  }

  const onSubmit = (values: CoveragePlanFormValues) => {
    setFormError(null)

    const fail = (path: Path<CoveragePlanFormValues>, message: string) => {
      setFormError(message)
      setError(path, { type: "manual", message })
      toast.error(message)
    }

    if (
      !isEdit &&
      manageOnly &&
      !!selfEmployeeUuid &&
      values.employeeUuid === selfEmployeeUuid
    ) {
      fail(
        "employeeUuid",
        "You have manage-only access. Select a team member; self-submission requires COVERAGE_PLAN_CREATE."
      )
      return
    }

    const keepsOriginalStart =
      allowPastStart && !!plan && values.startDate === plan.startDate
    if (!keepsOriginalStart) {
      const minimum = requiresTomorrow ? tomorrowIso() : todayIso()
      if (values.startDate < minimum) {
        fail(
          "startDate",
          requiresTomorrow
            ? "Start date must be tomorrow or later for an employee submission."
            : "Start date must be today or later."
        )
        return
      }
    }

    const payloadLines = buildCoverageLines(values.lines)
    const payload: CoveragePlanRequest = {
      employeeUuid: values.employeeUuid,
      startDate: values.startDate,
      endDate:
        effectiveCoverageEndDate({
          startDate: values.startDate,
          repeatType: values.repeatType,
          endDate: values.endDate,
          value:
            values.repeatType === "TILL_DATE"
              ? null
              : Number(values.repeatValue),
        }) || values.startDate,
      repeatRule: {
        type: values.repeatType,
        value:
          values.repeatType === "TILL_DATE" ? null : Number(values.repeatValue),
      },
      lines: payloadLines,
    }

    if (isEdit && plan) {
      // Resubmission accepts the replacement template in the same request, so
      // a rejected/withdrawn plan is replaced and requeued atomically instead
      // of being edited first and then resubmitted.
      if (resubmittableEdit) {
        resubmitMutation.mutate(
          { planUuid: plan.uuid, input: payload },
          {
            onSuccess: (resubmitted) => {
              toast.success("Coverage plan updated and resubmitted")
              onDone(resubmitted)
            },
            onError: (error) =>
              handleError(
                error,
                "Failed to update and resubmit coverage plan",
                payloadLines
              ),
          }
        )
        return
      }

      updateMutation.mutate(
        { planUuid: plan.uuid, input: payload },
        {
          onSuccess: (saved) => {
            toast.success("Coverage plan updated")
            onDone(saved)
          },
          onError: (error) =>
            handleError(error, "Failed to update coverage plan", payloadLines),
        }
      )
      return
    }

    createMutation.mutate(payload, {
      onSuccess: (saved) => {
        toast.success(
          saved.status === "APPROVED"
            ? "Coverage plan created and approved"
            : "Coverage plan submitted for approval"
        )
        onDone(saved)
      },
      onError: (error) =>
        handleError(error, "Failed to create coverage plan", payloadLines),
    })
  }

  const expectedStatus = (() => {
    if (!isEdit) {
      return isSelfTarget ? "PENDING_APPROVAL" : "APPROVED"
    }
    if (plan?.status === "APPROVED") return "APPROVED"
    if (resubmittableEdit) return "PENDING_APPROVAL"
    return plan?.status ?? "PENDING_APPROVAL"
  })()

  const expectedStatusLabel =
    expectedStatus === "APPROVED"
      ? isEdit
        ? "Stays approved"
        : "Approved immediately"
      : expectedStatus === "PENDING_APPROVAL"
        ? "Pending approval"
        : expectedStatus === "REJECTED"
          ? "Stays rejected until resubmitted"
          : expectedStatus === "WITHDRAWN"
            ? "Stays withdrawn until resubmitted"
            : "Cancelled"

  const repeatLabel = formatCoverageRepeatRule(
    {
      type: repeatType,
      value:
        repeatValueNumber !== null && Number.isFinite(repeatValueNumber)
          ? repeatValueNumber
          : null,
    },
    effectiveEnd
  )

  const weekdaysSummary = includedLines.length
    ? includedLines
        .map(
          (line) =>
            `${COVERAGE_WEEKDAY_LABELS[line.weekday]} (${line.customerUuids.length})`
        )
        .join(", ")
    : "None selected"

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-4"
    >
      {plan?.rejectReason ? (
        <div
          role="note"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
        >
          <p className="font-medium">Manager&apos;s rejection reason</p>
          <p className="mt-0.5">{plan.rejectReason}</p>
        </div>
      ) : null}

      {formError ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span className="min-w-0 flex-1">{formError}</span>
          <button
            type="button"
            aria-label="Dismiss error"
            className="rounded-sm text-destructive/80 hover:text-destructive"
            onClick={() => setFormError(null)}
          >
            <X className="size-4" />
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-4">
          {missingEmployee ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>
                Your user is not linked to an employee record. Select an
                employee to create a coverage plan on their behalf, or ask an
                administrator to link your login to an employee.
              </span>
            </div>
          ) : null}

          {manageOnlyInvalid ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>
                You have manage-only access to coverage plans. Select a team
                member; creating a plan for yourself requires
                COVERAGE_PLAN_CREATE.
              </span>
            </div>
          ) : null}

          {missingPrimaryGeography ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>
                This employee has no primary geography assigned, so a coverage
                plan cannot be saved. Ask an administrator to assign one first.
              </span>
            </div>
          ) : null}

          {!isEdit && !isSelfTarget ? (
            <div
              role="note"
              className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200"
            >
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              <span>
                You are creating this plan on behalf of a team member. It is
                approved immediately and visit plans are generated for every
                eligible covered date.
              </span>
            </div>
          ) : null}

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <CalendarRange className="size-4 text-muted-foreground" />
                Plan basics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                {isEdit ? (
                  <Field>
                    <FieldLabel>Plan for</FieldLabel>
                    <div className="flex h-9 items-center rounded-lg border px-3 text-sm">
                      <EmployeeLabel
                        companyUuid={companyUuid}
                        employeeUuid={plan?.employeeUuid}
                      />
                      <span className="ml-auto text-xs text-muted-foreground">
                        Employee cannot be changed
                      </span>
                    </div>
                    <FieldError errors={[errors.employeeUuid]} />
                  </Field>
                ) : canManage ? (
                  <Field data-invalid={!!errors.employeeUuid}>
                    <FieldLabel>{requiredLabel("Plan for")}</FieldLabel>
                    <Controller
                      control={control}
                      name="employeeUuid"
                      render={({ field }) => (
                        <EmployeeCombobox
                          companyUuid={companyUuid}
                          value={field.value || null}
                          onValueChange={(value) => {
                            setFormError(null)
                            field.onChange(value ?? "")
                          }}
                          placeholder="Select an employee"
                          disabled={isSubmitting}
                        />
                      )}
                    />
                    <p className="text-xs text-muted-foreground">
                      {canCreate
                        ? "Keep yourself selected to submit for approval. Choosing a team member creates an approved plan immediately."
                        : "You have manage-only access. Choose a team member; self-submission requires COVERAGE_PLAN_CREATE."}
                    </p>
                    <FieldError errors={[errors.employeeUuid]} />
                  </Field>
                ) : (
                  <Field>
                    <FieldLabel>Plan for</FieldLabel>
                    <div className="flex h-9 items-center rounded-lg border px-3 text-sm">
                      <EmployeeLabel
                        companyUuid={companyUuid}
                        employeeUuid={selectedEmployeeUuid}
                      />
                      <span className="ml-auto text-xs text-muted-foreground">
                        Self submission
                      </span>
                    </div>
                    <FieldError errors={[errors.employeeUuid]} />
                  </Field>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <FormDateField
                      control={control}
                      name="startDate"
                      label={requiredLabel("Start date")}
                      placeholder="Select start date"
                      disablePast
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      {approvedEdit
                        ? "An approved plan can keep its original start date; any new start must be today or later."
                        : requiresTomorrow
                          ? "Employee submissions must start tomorrow or later."
                          : "Manager and administrator plans may start today."}
                    </p>
                  </div>

                  <Controller
                    control={control}
                    name="repeatType"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={!!fieldState.error}>
                        <FieldLabel>{requiredLabel("Repeat")}</FieldLabel>
                        <Select
                          items={REPEAT_TYPE_ITEMS}
                          value={field.value}
                          disabled={isSubmitting}
                          onValueChange={(value: string | null) => {
                            if (
                              value !== "TILL_DATE" &&
                              value !== "N_WEEKS" &&
                              value !== "N_PERIODS"
                            ) {
                              return
                            }
                            setFormError(null)
                            field.onChange(value)
                            setValue("endDate", "")
                            setValue("repeatValue", "")
                            clearErrors(["endDate", "repeatValue"])
                          }}
                        >
                          <SelectTrigger className="w-full" aria-label="Repeat">
                            <SelectValue placeholder="Select repeat type" />
                          </SelectTrigger>
                          <SelectContent className="p-2">
                            {REPEAT_TYPE_ITEMS.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />
                </div>

                {repeatType === "TILL_DATE" ? (
                  <FormDateField
                    control={control}
                    name="endDate"
                    label={requiredLabel("End date")}
                    placeholder="Select end date"
                    disablePast
                    disabled={isSubmitting}
                  />
                ) : (
                  <FormNumberField
                    control={control}
                    name="repeatValue"
                    label={requiredLabel(
                      repeatType === "N_WEEKS"
                        ? "Number of weeks"
                        : "Number of accounting periods"
                    )}
                    min={1}
                    max={maxCoverageRepeatValue(repeatType)}
                    step="1"
                    emptyValue=""
                    disabled={isSubmitting}
                    placeholder={
                      repeatType === "N_WEEKS"
                        ? "Enter number of weeks"
                        : "Enter number of periods"
                    }
                  />
                )}

                <div
                  className={cn(
                    "rounded-lg border bg-muted/20 p-3 text-sm",
                    spanValid === false &&
                      "border-destructive/40 bg-destructive/5 text-destructive"
                  )}
                >
                  {repeatType === "N_PERIODS" ? (
                    <span>
                      The server calculates the end date from the company&apos;s
                      accounting calendar. The resulting range must still fit
                      within {MAX_COVERAGE_SPAN_DAYS} calendar days.
                    </span>
                  ) : effectiveEnd ? (
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-medium">Coverage period:</span>
                      <span>
                        {formatCoverageDateRange(startDate, effectiveEnd)}
                      </span>
                      <span className="text-muted-foreground">
                        · {spanDays} day{spanDays === 1 ? "" : "s"}
                      </span>
                      {spanValid === false ? (
                        <span className="font-medium">
                          · Must be 1..{MAX_COVERAGE_SPAN_DAYS} days
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Choose the coverage period to see a summary.
                    </span>
                  )}
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2">
                  <UsersRound className="size-4 text-muted-foreground" />
                  Weekly template
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{includedCount}/6 weekdays</Badge>
                  <Badge variant="secondary">
                    {totalCustomers} customer
                    {totalCustomers === 1 ? "" : "s"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Tick each weekday you want to cover, then choose 1–200 active
                customers. Sunday is never a coverage day.
              </p>

              {linesRootError ? (
                <p
                  role="alert"
                  className="flex items-center gap-1.5 text-sm text-destructive"
                >
                  <AlertCircle className="size-4 shrink-0" />
                  {linesRootError}
                </p>
              ) : null}

              {lines.map((line, index) => (
                <CoverageWeekdayEditor
                  key={line.weekday}
                  companyUuid={companyUuid}
                  employeeUuid={selectedEmployeeUuid}
                  weekday={line.weekday}
                  included={line.included}
                  customerUuids={line.customerUuids}
                  onIncludedChange={(included) => setLine(index, { included })}
                  onCustomersChange={(customerUuids) =>
                    setLine(index, { customerUuids })
                  }
                  primaryTerritoryUuid={primaryTerritoryUuid}
                  primaryGeographyName={primaryGeography?.geographyName}
                  disabled={isSubmitting}
                  error={lineError(index)}
                />
              ))}
            </CardContent>
          </Card>
        </div>

        <aside className="flex flex-col gap-4">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="size-4 text-muted-foreground" />
                Plan summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col gap-3">
                <SummaryRow label="Status after save">
                  <Badge
                    variant={
                      expectedStatus === "APPROVED" ? "default" : "secondary"
                    }
                  >
                    {expectedStatusLabel}
                  </Badge>
                </SummaryRow>
                <SummaryRow label="Employee">
                  {selectedEmployeeUuid ? (
                    <EmployeeLabel
                      companyUuid={companyUuid}
                      employeeUuid={selectedEmployeeUuid}
                    />
                  ) : (
                    <span className="text-muted-foreground">Not selected</span>
                  )}
                </SummaryRow>
                <SummaryRow label="Period">
                  {repeatType === "N_PERIODS" ? (
                    <span>
                      From {formatCoverageDate(startDate)} · end calculated by
                      server
                    </span>
                  ) : effectiveEnd ? (
                    formatCoverageDateRange(startDate, effectiveEnd)
                  ) : (
                    <span className="text-muted-foreground">Not set</span>
                  )}
                </SummaryRow>
                <SummaryRow label="Repeat">{repeatLabel}</SummaryRow>
                <SummaryRow label="Weekdays">
                  <span className="text-muted-foreground">
                    {weekdaysSummary}
                  </span>
                </SummaryRow>
                <SummaryRow label="Assignments">
                  {totalCustomers} customer
                  {totalCustomers === 1 ? "" : "s"}
                </SummaryRow>
                <SummaryRow label="Primary geography">
                  {geographiesQuery.isLoading ? (
                    <span className="text-muted-foreground">Loading…</span>
                  ) : primaryGeography ? (
                    primaryGeography.geographyName
                  ) : (
                    <span className="text-muted-foreground">Not assigned</span>
                  )}
                </SummaryRow>
              </dl>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="size-4 text-muted-foreground" />
                Good to know
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex list-disc flex-col gap-2 pl-4 text-xs text-muted-foreground">
                <li>Sunday is never a coverage day.</li>
                <li>
                  Each included weekday needs 1–200 unique customers, and the
                  same customer can repeat on different weekdays.
                </li>
                <li>
                  A plan spans at most {MAX_COVERAGE_SPAN_DAYS} calendar days.
                </li>
                <li>
                  Only active customers in the employee&apos;s primary geography
                  are accepted. The server checks every selection.
                </li>
                <li>
                  Holidays, weekly offs and dates with a manual visit plan are
                  skipped automatically. Rejections are listed on the plan.
                </li>
              </ul>
            </CardContent>
          </Card>
        </aside>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">
            {resubmittableEdit
              ? "The replacement template is sent to the manager for approval in one step."
              : isEdit
                ? "Saving an approved plan regenerates future visit plans."
                : isSelfTarget
                  ? "Your plan is sent to your direct manager for approval."
                  : "The plan is approved immediately and generates visit plans."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onCancel ? (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          ) : null}
          <Button type="submit" disabled={disableSubmit}>
            {isSubmitting ? <Spinner className="mr-2 size-4" /> : null}
            {isEdit
              ? resubmittableEdit
                ? "Save & resubmit"
                : "Save changes"
              : "Create coverage plan"}
          </Button>
        </div>
      </div>
    </form>
  )
}
