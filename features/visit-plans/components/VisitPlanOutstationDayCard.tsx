"use client"

import { CalendarDays } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatVisitPlanDate } from "../lib/visit-plan.utils"
import { VisitPlanCustomerPicker } from "./VisitPlanCustomerPicker"

type VisitPlanOutstationDayCardProps = {
  companyUuid: string
  employeeUuid?: string | null
  date: string
  destinationGeographyUuid?: string | null
  excludePlanUuid?: string
  value: string[]
  onChange: (customerUuids: string[]) => void
  disabled?: boolean
  error?: string
}

/** One OUTSTATION day. Every day in the range needs 1..200 customers. */
export function VisitPlanOutstationDayCard({
  companyUuid,
  employeeUuid,
  date,
  destinationGeographyUuid,
  excludePlanUuid,
  value,
  onChange,
  disabled,
  error,
}: VisitPlanOutstationDayCardProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <CalendarDays className="size-4 text-muted-foreground" />
          {formatVisitPlanDate(date)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <VisitPlanCustomerPicker
          companyUuid={companyUuid}
          employeeUuid={employeeUuid}
          date={date}
          planType="OUTSTATION"
          destinationGeographyUuid={destinationGeographyUuid}
          excludePlanUuid={excludePlanUuid}
          value={value}
          onChange={onChange}
          disabled={disabled}
          invalid={!!error}
          error={error}
          label="Customers"
        />
      </CardContent>
    </Card>
  )
}
