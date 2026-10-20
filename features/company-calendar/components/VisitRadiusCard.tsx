"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
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
import { FieldGroup } from "@/components/ui/field"
import { FormNumberField, requiredLabel } from "@/components/common/form-fields"
import { applyApiFieldErrors } from "@/lib/api/form-errors"
import { usePermission } from "@/hooks/use-permission"
import { useUpdateVisitRadius } from "../hooks/use-update-visit-radius"
import { getCalendarErrorMessage } from "../utils/calendar.utils"
import type { CalendarSettings } from "../api/company-calendar.types"

const radiusSchema = z.object({
  visitRadiusMeters: z
    .string()
    .trim()
    .min(1, "Visit radius is required")
    .refine((value) => /^\d+$/.test(value), "Enter a whole number")
    .refine((value) => {
      const numeric = Number(value)
      return numeric >= 20 && numeric <= 5000
    }, "Must be between 20 and 5000 metres"),
})

type RadiusFormValues = z.infer<typeof radiusSchema>

type VisitRadiusCardProps = {
  companyUuid: string
  settings: CalendarSettings
}

export function VisitRadiusCard({
  companyUuid,
  settings,
}: VisitRadiusCardProps) {
  const updateMutation = useUpdateVisitRadius(companyUuid)
  const { can } = usePermission()
  const canManage = can("VISIT_RADIUS", "MANAGE")

  const { control, handleSubmit, reset, setError } = useForm<RadiusFormValues>({
    resolver: zodResolver(radiusSchema),
    defaultValues: {
      visitRadiusMeters: String(settings.visitRadiusMeters),
    },
  })

  useEffect(() => {
    reset({ visitRadiusMeters: String(settings.visitRadiusMeters) })
  }, [settings.visitRadiusMeters, reset])

  const onSubmit = (values: RadiusFormValues) => {
    updateMutation.mutate(
      { visitRadiusMeters: Number(values.visitRadiusMeters) },
      {
        onSuccess: () => toast.success("Visit radius updated"),
        onError: (error) => {
          applyApiFieldErrors(error, setError)
          toast.error(
            getCalendarErrorMessage(error, "Failed to update visit radius")
          )
        },
      }
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visit radius</CardTitle>
        <CardDescription>
          Geofence radius used to validate field visit check-ins. Allowed range:
          20 to 5000 metres.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <FieldGroup>
            <FormNumberField
              control={control}
              name="visitRadiusMeters"
              label={requiredLabel("Visit radius (metres)")}
              min={20}
              step="1"
              disabled={!canManage || updateMutation.isPending}
            />
          </FieldGroup>
          {canManage ? (
            <div className="flex justify-end">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save radius"}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              You have view-only access to the visit radius.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
