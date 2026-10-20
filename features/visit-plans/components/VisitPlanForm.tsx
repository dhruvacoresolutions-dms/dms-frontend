"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type Path,
} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { AlertCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FormDateField, requiredLabel } from "@/components/common/form-fields"
import { EntityCombobox } from "@/components/common/EntityCombobox"
import { EmployeeCombobox } from "@/features/employees/components/EmployeeCombobox"
import { useEmployeeGeographies } from "@/features/employees/hooks/use-employee-geographies"
import { useAuthStore } from "@/stores/auth-store"
import { usePermission } from "@/hooks/use-permission"
import { useCreateVisitPlan } from "../hooks/use-create-visit-plan"
import { useUpdateVisitPlan } from "../hooks/use-update-visit-plan"
import {
  MAX_VISIT_PLAN_CUSTOMERS,
  enumerateDates,
  formatVisitPlanDate,
  getVisitPlanErrorMessage,
  isVisitPlanSpanValid,
  todayIso,
  tomorrowIso,
} from "../lib/visit-plan.utils"
import { getApiError } from "@/lib/api/api-error"
import type {
  VisitPlan,
  VisitPlanRequest,
  VisitPlanType,
} from "../api/visit-plan.types"
import { VisitPlanCustomerPicker } from "./VisitPlanCustomerPicker"
import { VisitPlanOutstationDayCard } from "./VisitPlanOutstationDayCard"
import { EmployeeLabel } from "./EmployeeLabel"

const PLAN_TYPE_ITEMS: { value: VisitPlanType; label: string }[] = [
  { value: "LOCAL", label: "Local (single day)" },
  { value: "OUTSTATION", label: "Outstation (multi-day)" },
]

type VisitPlanFormValues = {
  employeeUuid: string
  planType: VisitPlanType
  date: string
  fromDate: string
  toDate: string
  destinationGeographyUuid: string
  customerUuids: string[]
  days: { date: string; customerUuids: string[] }[]
}

type VisitPlanFormProps = {
  companyUuid: string
  /** Existing plan (edit mode). Omit to create. */
  plan?: VisitPlan
  onDone: (saved: VisitPlan) => void
  onCancel?: () => void
}

/**
 * Zod rules mirror `VisitPlanService.validate`:
 * - LOCAL: date required (tomorrow for a self submission, today when a
 *   manager creates/edits on someone's behalf), 1..200 unique customers.
 *   A manager editing an APPROVED plan may clear the list.
 * - OUTSTATION: destination must be an ADDITIONAL geography, fromDate/toDate
 *   required, span < 31 days, and exactly one day per date in the range with
 *   1..200 unique customers.
 */
function buildSchema({
  requiresTomorrow,
  allowEmptyLocal,
}: {
  requiresTomorrow: boolean
  allowEmptyLocal: boolean
}) {
  return z
    .object({
      employeeUuid: z.string(),
      planType: z.enum(["LOCAL", "OUTSTATION"]),
      date: z.string(),
      fromDate: z.string(),
      toDate: z.string(),
      destinationGeographyUuid: z.string(),
      customerUuids: z.array(z.string()),
      days: z.array(
        z.object({
          date: z.string(),
          customerUuids: z.array(z.string()),
        })
      ),
    })
    .superRefine((values, ctx) => {
      const minimumDate = requiresTomorrow ? tomorrowIso() : todayIso()
      const issue = (path: (string | number)[], message: string) =>
        ctx.addIssue({ code: z.ZodIssueCode.custom, path, message })

      if (values.planType === "LOCAL") {
        if (!values.date) {
          issue(["date"], "Date is required")
        } else if (values.date < minimumDate) {
          issue(
            ["date"],
            requiresTomorrow
              ? "Date must be tomorrow or later"
              : "Date must be today or later"
          )
        }

        const minimumCustomers = allowEmptyLocal ? 0 : 1
        if (
          values.customerUuids.length < minimumCustomers ||
          values.customerUuids.length > MAX_VISIT_PLAN_CUSTOMERS
        ) {
          issue(["customerUuids"], "Must contain 1..200 customers")
        } else if (
          new Set(values.customerUuids).size !== values.customerUuids.length
        ) {
          issue(
            ["customerUuids"],
            "Each customer must occur once per employee and date"
          )
        }
        return
      }

      if (!values.destinationGeographyUuid) {
        issue(["destinationGeographyUuid"], "is required")
      }
      if (!values.fromDate) {
        issue(["fromDate"], "From date is required")
      } else if (values.fromDate < minimumDate) {
        issue(
          ["fromDate"],
          requiresTomorrow
            ? "Date must be tomorrow or later"
            : "Date must be today or later"
        )
      }
      if (!values.toDate) {
        issue(["toDate"], "To date is required")
      } else if (values.fromDate && values.toDate < values.fromDate) {
        issue(["toDate"], "To date must be on or after the from date")
      } else if (
        values.fromDate &&
        !isVisitPlanSpanValid(values.fromDate, values.toDate)
      ) {
        issue(["toDate"], "Must span at most 31 days")
      }

      const expectedDates = enumerateDates(values.fromDate, values.toDate)
      if (expectedDates.length === 0) return

      values.days.forEach((day, index) => {
        const dayLabel = day.date ? formatVisitPlanDate(day.date) : "this day"
        if (!day.date) {
          issue(["days", index, "date"], "Date is required")
        } else if (!expectedDates.includes(day.date)) {
          issue(
            ["days", index, "date"],
            `Date must be inside ${values.fromDate} to ${values.toDate}`
          )
        }
        if (
          day.customerUuids.length === 0 ||
          day.customerUuids.length > MAX_VISIT_PLAN_CUSTOMERS
        ) {
          issue(
            ["days", index, "customerUuids"],
            `Must contain 1..200 customers on ${dayLabel}`
          )
        } else if (
          new Set(day.customerUuids).size !== day.customerUuids.length
        ) {
          issue(
            ["days", index, "customerUuids"],
            `Each customer must occur once per employee and date: ${dayLabel}`
          )
        }
      })

      for (const expected of expectedDates) {
        if (!values.days.some((day) => day.date === expected)) {
          issue(
            ["days"],
            `At least one customer is required on ${formatVisitPlanDate(expected)}`
          )
        }
      }
    })
}

function initialValues(plan?: VisitPlan): VisitPlanFormValues {
  if (!plan) {
    return {
      employeeUuid: "",
      planType: "LOCAL",
      date: "",
      fromDate: "",
      toDate: "",
      destinationGeographyUuid: "",
      customerUuids: [],
      days: [],
    }
  }

  const active = (customers: VisitPlan["customers"]) =>
    customers
      .filter((customer) => !customer.removedByApprover)
      .map((customer) => customer.customerUuid)

  return {
    employeeUuid: plan.employeeUuid,
    planType: plan.planType,
    date: plan.date,
    fromDate: plan.fromDate ?? plan.date,
    toDate: plan.toDate ?? plan.date,
    destinationGeographyUuid: plan.destinationGeographyUuid ?? "",
    customerUuids: plan.planType === "LOCAL" ? active(plan.customers) : [],
    days:
      plan.planType === "OUTSTATION"
        ? (plan.days ?? []).map((day) => ({
            date: day.date,
            customerUuids: active(day.customers),
          }))
        : [],
  }
}

function serverFieldPath(field: string): Path<VisitPlanFormValues> | null {
  if (field.startsWith("days[")) {
    const match = /^days\[(\d+)\]\.(\w+)$/.exec(field)
    if (match) {
      return `days.${match[1]}.${match[2]}` as Path<VisitPlanFormValues>
    }
    return "days" as Path<VisitPlanFormValues>
  }
  switch (field) {
    case "employeeUuid":
    case "planType":
    case "date":
    case "fromDate":
    case "toDate":
    case "destinationGeographyUuid":
    case "customerUuids":
      return field
    default:
      return null
  }
}

/**
 * Create/edit form for a visit plan. On edit the employee is locked (the
 * backend rejects `Employee cannot be changed`) and an APPROVED plan may only
 * be edited by a manager.
 */
export function VisitPlanForm({
  companyUuid,
  plan,
  onDone,
  onCancel,
}: VisitPlanFormProps) {
  const isEdit = !!plan
  const selfEmployeeUuid =
    useAuthStore((state) => state.session?.user?.employeeUuid) ?? null
  const { can } = usePermission()
  const canManage = can("VISIT_PLAN", "MANAGE")

  const approvedEdit = isEdit && plan?.status === "APPROVED"
  const [selectedEmployeeUuid, setSelectedEmployeeUuid] = useState(
    () => initialValues(plan).employeeUuid
  )
  const isSelfSubmission =
    !isEdit &&
    (!selectedEmployeeUuid || selectedEmployeeUuid === selfEmployeeUuid)
  const requiresTomorrow = approvedEdit
    ? false
    : isEdit
      ? true
      : isSelfSubmission

  const schema = useMemo(
    () =>
      buildSchema({
        requiresTomorrow,
        allowEmptyLocal: approvedEdit,
      }),
    [requiresTomorrow, approvedEdit]
  )

  const {
    control,
    handleSubmit,
    getValues,
    setError,
    setValue,
    formState: { errors },
  } = useForm<VisitPlanFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues(plan),
  })

  const { fields, replace } = useFieldArray({ control, name: "days" })

  const planType = useWatch({ control, name: "planType" })
  const date = useWatch({ control, name: "date" })
  const fromDate = useWatch({ control, name: "fromDate" })
  const toDate = useWatch({ control, name: "toDate" })
  const destinationGeographyUuid = useWatch({
    control,
    name: "destinationGeographyUuid",
  })

  const [formError, setFormError] = useState<string | null>(null)

  const createMutation = useCreateVisitPlan(companyUuid)
  const updateMutation = useUpdateVisitPlan(companyUuid)
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const effectiveEmployeeUuid = selectedEmployeeUuid || selfEmployeeUuid || ""

  const geographiesQuery = useEmployeeGeographies(
    companyUuid,
    effectiveEmployeeUuid
  )
  const destinationOptions = useMemo(
    () =>
      (geographiesQuery.data ?? [])
        .filter((geography) => !geography.primaryAssignment)
        .map((geography) => ({
          id: geography.geographyUuid,
          label: geography.geographyName,
          sub: geography.geographyCode,
        })),
    [geographiesQuery.data]
  )

  // Keep one day entry per date in the OUTSTATION range, preserving choices.
  useEffect(() => {
    if (planType !== "OUTSTATION") return
    const dates = enumerateDates(fromDate, toDate)
    if (dates.length === 0) return
    const current = getValues("days")
    const retained = new Map(
      current.map((day) => [day.date, day.customerUuids] as const)
    )
    const next = dates.map((date) => ({
      date,
      customerUuids: retained.get(date) ?? [],
    }))
    const unchanged =
      current.length === next.length &&
      next.every((day, index) => day.date === current[index]?.date)
    if (!unchanged) replace(next)
  }, [planType, fromDate, toDate, getValues, replace])

  // The employee decides which geographies and customers are valid, so reset
  // the destination and every customer selection when it changes.
  useEffect(() => {
    if (isEdit) return
    setValue("destinationGeographyUuid", "")
    setValue("customerUuids", [])
    setValue(
      "days",
      getValues("days").map((day) => ({ date: day.date, customerUuids: [] }))
    )
  }, [isEdit, selectedEmployeeUuid, setValue, getValues])

  const onSubmit = (values: VisitPlanFormValues) => {
    setFormError(null)
    const common = values.employeeUuid
      ? { employeeUuid: values.employeeUuid }
      : {}

    const payload: VisitPlanRequest =
      values.planType === "LOCAL"
        ? {
            ...common,
            planType: "LOCAL",
            date: values.date,
            customerUuids: values.customerUuids,
          }
        : {
            ...common,
            planType: "OUTSTATION",
            fromDate: values.fromDate,
            toDate: values.toDate,
            destinationGeographyUuid: values.destinationGeographyUuid,
            days: values.days.map((day) => ({
              date: day.date,
              customerUuids: day.customerUuids,
            })),
          }

    const onSuccess = (saved: VisitPlan) => {
      toast.success(
        isEdit
          ? "Visit plan updated"
          : saved.status === "APPROVED"
            ? "Visit plan created and approved"
            : "Visit plan submitted for approval"
      )
      onDone(saved)
    }

    const onError = (error: unknown) => {
      const details = getApiError(error)?.errors ?? []
      let applied = false
      for (const detail of details) {
        if (!detail?.field || !detail.message) continue
        const path = serverFieldPath(detail.field)
        if (path) {
          setError(path, { type: "server", message: detail.message })
          applied = true
        }
      }
      const message = getVisitPlanErrorMessage(
        error,
        isEdit ? "Failed to update visit plan" : "Failed to create visit plan"
      )
      if (!applied) setFormError(message)
      toast.error(message)
    }

    if (isEdit && plan) {
      updateMutation.mutate(
        { planUuid: plan.uuid, input: payload },
        { onSuccess, onError }
      )
      return
    }
    createMutation.mutate(payload, { onSuccess, onError })
  }

  const missingEmployee = !effectiveEmployeeUuid

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        {formError ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{formError}</span>
          </div>
        ) : null}

        {missingEmployee ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>
              Your user is not linked to an employee record, so a visit plan
              cannot be created. Ask an administrator to link your login to an
              employee.
            </span>
          </div>
        ) : null}

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
          </Field>
        ) : canManage ? (
          <Field>
            <FieldLabel>Plan for</FieldLabel>
            <Controller
              control={control}
              name="employeeUuid"
              render={({ field }) => (
                <EmployeeCombobox
                  companyUuid={companyUuid}
                  value={field.value || null}
                  onValueChange={(value) => {
                    field.onChange(value ?? "")
                    setSelectedEmployeeUuid(value ?? "")
                  }}
                  placeholder="Myself (default)"
                />
              )}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to plan for yourself. Planning for another employee
              requires VISIT_PLAN_MANAGE and a direct-manager relationship, and
              the plan is approved immediately.
            </p>
            <FieldError errors={[errors.employeeUuid]} />
          </Field>
        ) : null}

        <Controller
          control={control}
          name="planType"
          render={({ field, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel>{requiredLabel("Plan type")}</FieldLabel>
              <Select
                items={PLAN_TYPE_ITEMS}
                value={field.value}
                onValueChange={(value: string | null) => {
                  if (value === "LOCAL" || value === "OUTSTATION") {
                    field.onChange(value)
                  }
                }}
              >
                <SelectTrigger className="w-full" aria-label="Plan type">
                  <SelectValue placeholder="Select plan type" />
                </SelectTrigger>
                <SelectContent className="p-2">
                  {PLAN_TYPE_ITEMS.map((item) => (
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

        {planType === "LOCAL" ? (
          <>
            <FormDateField
              control={control}
              name="date"
              label={requiredLabel("Date")}
              placeholder="Select plan date"
              disablePast
            />
            <Controller
              control={control}
              name="customerUuids"
              render={({ field, fieldState }) => (
                <VisitPlanCustomerPicker
                  companyUuid={companyUuid}
                  employeeUuid={effectiveEmployeeUuid || null}
                  date={date}
                  planType="LOCAL"
                  excludePlanUuid={plan?.uuid}
                  value={field.value}
                  onChange={field.onChange}
                  invalid={!!fieldState.error}
                  error={fieldState.error?.message}
                />
              )}
            />
          </>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormDateField
                control={control}
                name="fromDate"
                label={requiredLabel("From date")}
                placeholder="Select start date"
                disablePast
              />
              <FormDateField
                control={control}
                name="toDate"
                label={requiredLabel("To date")}
                placeholder="Select end date"
                disablePast
              />
            </div>

            <Controller
              control={control}
              name="destinationGeographyUuid"
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel>
                    {requiredLabel("Destination geography")}
                  </FieldLabel>
                  <EntityCombobox
                    companyUuid={companyUuid}
                    value={field.value || null}
                    onValueChange={(value) => field.onChange(value ?? "")}
                    options={destinationOptions}
                    selectedOption={
                      destinationOptions.find(
                        (option) => option.id === field.value
                      ) ?? null
                    }
                    loading={geographiesQuery.isLoading}
                    placeholder="Select an additional geography"
                    emptyText="No additional geographies assigned to this employee."
                  />
                  <p className="text-xs text-muted-foreground">
                    The destination must be one of the employee&apos;s
                    additional geographies — never the primary geography.
                  </p>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            {fields.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Select a valid date range to build the day-wise plan.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-sm font-medium">
                    {requiredLabel("Day-wise customers")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Every date in the range needs 1..200 customers, including
                    travel or rest days.
                  </p>
                </div>
                {errors.days && !Array.isArray(errors.days) ? (
                  <FieldError errors={[errors.days]} />
                ) : null}
                {fields.map((day, index) => (
                  <Controller
                    key={day.id}
                    control={control}
                    name={`days.${index}.customerUuids`}
                    render={({ field, fieldState }) => (
                      <VisitPlanOutstationDayCard
                        companyUuid={companyUuid}
                        employeeUuid={effectiveEmployeeUuid || null}
                        date={day.date}
                        destinationGeographyUuid={
                          destinationGeographyUuid || null
                        }
                        excludePlanUuid={plan?.uuid}
                        value={field.value}
                        onChange={field.onChange}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                ))}
              </div>
            )}
          </>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
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
          <Button type="submit" disabled={isSubmitting || missingEmployee}>
            {isSubmitting ? <Spinner className="mr-2 size-4" /> : null}
            {isEdit ? "Save changes" : "Create visit plan"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}
