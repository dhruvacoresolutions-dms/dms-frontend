"use client"

import { useEffect, useMemo } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  FormNumberField,
  FormSelectField,
  requiredLabel,
} from "@/components/common/form-fields"
import { applyApiFieldErrors } from "@/lib/api/form-errors"
import { usePermission } from "@/hooks/use-permission"
import { CLAIM_WINDOW_MODE_OPTIONS } from "../configs/calendar.constants"
import { useUpdateClaimPolicy } from "../hooks/use-update-claim-policy"
import { getCalendarErrorMessage } from "../utils/calendar.utils"
import type { CalendarSettings } from "../api/company-calendar.types"

function isValidIanaZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value })
    return true
  } catch {
    return false
  }
}

const policySchema = z.object({
  companyTimezone: z
    .string()
    .trim()
    .min(1, "Company timezone is required")
    .refine(
      isValidIanaZone,
      "Enter a valid IANA timezone (for example Asia/Kolkata)"
    ),
  claimWindowMode: z.enum(["N_DAYS", "ACCOUNTING_PERIOD_END"]),
  claimWindowDays: z
    .string()
    .trim()
    .min(1, "Claim window days is required")
    .refine((value) => /^\d+$/.test(value), "Enter a whole number")
    .refine((value) => {
      const numeric = Number(value)
      return numeric >= 1 && numeric <= 90
    }, "Must be between 1 and 90 days"),
})

type PolicyFormValues = z.infer<typeof policySchema>

type ClaimPolicyCardProps = {
  companyUuid: string
  settings: CalendarSettings
}

export function ClaimPolicyCard({
  companyUuid,
  settings,
}: ClaimPolicyCardProps) {
  const updateMutation = useUpdateClaimPolicy(companyUuid)
  const { can } = usePermission()
  const canManage = can("CLAIM_POLICY", "MANAGE")

  const timezones = useMemo(() => {
    try {
      const supported = (
        Intl as unknown as {
          supportedValuesOf?: (key: string) => string[]
        }
      ).supportedValuesOf?.("timeZone")
      return supported?.length ? supported : []
    } catch {
      return []
    }
  }, [])

  const { control, handleSubmit, reset, setError } = useForm<PolicyFormValues>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      companyTimezone: settings.companyTimezone,
      claimWindowMode: settings.claimWindowMode,
      claimWindowDays: String(settings.claimWindowDays),
    },
  })

  useEffect(() => {
    reset({
      companyTimezone: settings.companyTimezone,
      claimWindowMode: settings.claimWindowMode,
      claimWindowDays: String(settings.claimWindowDays),
    })
  }, [
    settings.companyTimezone,
    settings.claimWindowMode,
    settings.claimWindowDays,
    reset,
  ])

  const onSubmit = (values: PolicyFormValues) => {
    updateMutation.mutate(
      {
        companyTimezone: values.companyTimezone.trim(),
        claimWindowMode: values.claimWindowMode,
        claimWindowDays: Number(values.claimWindowDays),
      },
      {
        onSuccess: () => toast.success("Claim policy updated"),
        onError: (error) => {
          applyApiFieldErrors(error, setError)
          toast.error(
            getCalendarErrorMessage(error, "Failed to update claim policy")
          )
        },
      }
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Claim policy</CardTitle>
        <CardDescription>
          Company timezone and the expense-claim submission window. The window
          is always 1 to 90 days, even when the accounting-period mode is used.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <FieldGroup>
            <Controller
              control={control}
              name="companyTimezone"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>{requiredLabel("Company timezone")}</FieldLabel>
                  <Input
                    list="company-calendar-timezones"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    disabled={!canManage || updateMutation.isPending}
                    placeholder="Enter IANA timezone"
                    autoComplete="off"
                    aria-invalid={!!fieldState.error}
                  />
                  <datalist id="company-calendar-timezones">
                    {timezones.map((zone) => (
                      <option key={zone} value={zone} />
                    ))}
                  </datalist>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <FormSelectField
              control={control}
              name="claimWindowMode"
              label={requiredLabel("Claim window mode")}
              options={CLAIM_WINDOW_MODE_OPTIONS}
              disabled={!canManage || updateMutation.isPending}
            />

            <FormNumberField
              control={control}
              name="claimWindowDays"
              label={requiredLabel("Claim window days")}
              min={1}
              step="1"
              disabled={!canManage || updateMutation.isPending}
            />
          </FieldGroup>
          {canManage ? (
            <div className="flex justify-end">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save claim policy"}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              You have view-only access to the claim policy.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
