"use client"

import { useEffect, useMemo } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Info, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { FormSelectField } from "@/components/common/form-fields"
import { applyApiFieldErrors } from "@/lib/api/form-errors"
import { usePermission } from "@/hooks/use-permission"
import { SATURDAY_MODE_OPTIONS, WEEK_DAYS } from "../configs/calendar.constants"
import { useWeeklyOffRule } from "../hooks/use-weekly-off-rule"
import { useUpdateWeeklyOffRule } from "../hooks/use-update-weekly-off-rule"
import { getCalendarErrorMessage } from "../utils/calendar.utils"
import type { WeeklyOffDay } from "../api/company-calendar.types"

const weeklyOffSchema = z.object({
  weeklyOffDays: z.array(
    z.enum([
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ])
  ),
  alternateSaturdayMode: z.enum([
    "NONE",
    "FIRST_THIRD",
    "SECOND_FOURTH",
    "ALL",
  ]),
})

type WeeklyOffValues = z.infer<typeof weeklyOffSchema>

const DEFAULT_VALUES: WeeklyOffValues = {
  weeklyOffDays: [],
  alternateSaturdayMode: "SECOND_FOURTH",
}

export function WeeklyOffRuleForm({ companyUuid }: { companyUuid: string }) {
  const {
    data: rule,
    isLoading,
    error,
    refetch,
  } = useWeeklyOffRule(companyUuid)
  const updateMutation = useUpdateWeeklyOffRule(companyUuid)
  const { can } = usePermission()
  const canManage = can("COMPANY_CALENDAR", "MANAGE")

  const { control, handleSubmit, reset, setError } = useForm<WeeklyOffValues>({
    resolver: zodResolver(weeklyOffSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const initialValues = useMemo<WeeklyOffValues>(
    () =>
      rule
        ? {
            weeklyOffDays: rule.weeklyOffDays,
            alternateSaturdayMode: rule.alternateSaturdayMode,
          }
        : DEFAULT_VALUES,
    [rule]
  )

  useEffect(() => {
    reset(initialValues)
  }, [initialValues, reset])

  const onSubmit = (values: WeeklyOffValues) => {
    updateMutation.mutate(
      {
        weeklyOffDays: values.weeklyOffDays as WeeklyOffDay[],
        alternateSaturdayMode: values.alternateSaturdayMode,
      },
      {
        onSuccess: () => toast.success("Weekly off rule saved"),
        onError: (err) => {
          applyApiFieldErrors(err, setError)
          toast.error(
            getCalendarErrorMessage(err, "Failed to save weekly off rule")
          )
        },
      }
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading weekly off rule…
      </div>
    )
  }

  if (error && !rule) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg border p-4 text-sm">
        <p className="text-destructive">
          {getCalendarErrorMessage(error, "Failed to load the weekly off rule")}
        </p>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          Try again
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {!rule?.uuid ? (
        <Alert>
          <Info />
          <AlertTitle>Service defaults in use</AlertTitle>
          <AlertDescription>
            No weekly off rule has been saved for this company yet. The values
            below are the service defaults; save to persist them.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Working week</CardTitle>
          <CardDescription>
            Choose the days that are off every week and how alternate Saturdays
            are handled when resolving the effective company calendar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Controller
              control={control}
              name="weeklyOffDays"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Weekly off days</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {WEEK_DAYS.map((day) => {
                      const selected = field.value.includes(day.value)
                      return (
                        <label
                          key={day.value}
                          className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={selected}
                            disabled={!canManage || updateMutation.isPending}
                            onCheckedChange={(checked) => {
                              const next =
                                checked === true
                                  ? [...field.value, day.value]
                                  : field.value.filter(
                                      (value) => value !== day.value
                                    )
                              field.onChange(
                                WEEK_DAYS.filter((d) =>
                                  next.includes(d.value)
                                ).map((d) => d.value)
                              )
                            }}
                          />
                          <span>{day.label}</span>
                        </label>
                      )
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    An empty selection means every day is a working day, except
                    the alternate Saturdays configured below.
                  </p>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <FormSelectField
              control={control}
              name="alternateSaturdayMode"
              label="Alternate Saturdays"
              options={SATURDAY_MODE_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              disabled={!canManage || updateMutation.isPending}
            />
            <p className="-mt-2 text-xs text-muted-foreground">
              {
                SATURDAY_MODE_OPTIONS.find(
                  (option) =>
                    option.value ===
                    (rule?.alternateSaturdayMode ?? "SECOND_FOURTH")
                )?.description
              }
            </p>
          </FieldGroup>
        </CardContent>
      </Card>

      {canManage ? (
        <div className="flex justify-end">
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save weekly off rule"
            )}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          You have view-only access to the company calendar.
        </p>
      )}
    </form>
  )
}
