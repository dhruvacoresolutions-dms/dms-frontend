"use client"

import { useMemo, useState } from "react"
import { AlertCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  formatVisitPlanDate,
  getVisitPlanErrorMessage,
  MAX_VISIT_PLAN_NOTE_LENGTH,
} from "../lib/visit-plan.utils"
import { useApproveVisitPlan } from "../hooks/use-approve-visit-plan"
import type {
  ApproveVisitPlanRequest,
  VisitPlan,
} from "../api/visit-plan.types"
import { CustomerNameLabel } from "./CustomerNameLabel"

type ApproveVisitPlanDialogProps = {
  companyUuid: string
  plan: VisitPlan | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type PlanDay = {
  date: string
  customers: {
    customerUuid: string
    removedByApprover: boolean
    removedNote: string | null
  }[]
}

/**
 * Approve a PENDING_APPROVAL plan. LOCAL plans remove customers plan-wide;
 * OUTSTATION plans remove them per day. Both flavours require a shared
 * 1..2000-character note when anything is removed, and at least one customer
 * must remain on every day.
 */
export function ApproveVisitPlanDialog({
  companyUuid,
  plan,
  open,
  onOpenChange,
}: ApproveVisitPlanDialogProps) {
  const approveMutation = useApproveVisitPlan(companyUuid)
  const [selected, setSelected] = useState<Record<string, string[]>>({})
  const [note, setNote] = useState("")
  const [noteError, setNoteError] = useState<string | null>(null)
  const [dayError, setDayError] = useState<string | null>(null)

  const days = useMemo<PlanDay[]>(() => {
    if (!plan) return []
    if (plan.days?.length) return plan.days
    return [{ date: plan.date, customers: plan.customers }]
  }, [plan])

  const resetState = () => {
    setSelected({})
    setNote("")
    setNoteError(null)
    setDayError(null)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) resetState()
    onOpenChange(next)
  }

  const removalCount = Object.values(selected).reduce(
    (total, ids) => total + ids.length,
    0
  )

  const toggle = (date: string, customerUuid: string, removed: boolean) => {
    if (removed) return
    setSelected((previous) => {
      const current = previous[date] ?? []
      const next = current.includes(customerUuid)
        ? current.filter((uuid) => uuid !== customerUuid)
        : [...current, customerUuid]
      return { ...previous, [date]: next }
    })
    setDayError(null)
  }

  const handleSubmit = () => {
    if (!plan) return
    setNoteError(null)
    setDayError(null)

    if (removalCount > 0) {
      const trimmed = note.trim()
      if (!trimmed || trimmed.length > MAX_VISIT_PLAN_NOTE_LENGTH) {
        setNoteError(
          `A note of 1..${MAX_VISIT_PLAN_NOTE_LENGTH} characters is required when removing customers`
        )
        return
      }
    }

    for (const day of days) {
      const active = day.customers.filter(
        (customer) => !customer.removedByApprover
      ).length
      const removing = selected[day.date]?.length ?? 0
      if (active > 0 && removing >= active) {
        setDayError(
          `At least one customer must remain on ${formatVisitPlanDate(day.date)}`
        )
        return
      }
    }

    let input: ApproveVisitPlanRequest = {}
    if (removalCount > 0) {
      const trimmed = note.trim()
      if (plan.planType === "LOCAL") {
        input = {
          removedCustomerUuids: Object.values(selected).flat(),
          note: trimmed,
        }
      } else {
        input = {
          days: days
            .filter((day) => (selected[day.date]?.length ?? 0) > 0)
            .map((day) => ({
              date: day.date,
              removedCustomerUuids: selected[day.date],
            })),
          note: trimmed,
        }
      }
    }

    approveMutation.mutate(
      { planUuid: plan.uuid, input },
      {
        onSuccess: () => {
          toast.success("Visit plan approved")
          handleOpenChange(false)
        },
        onError: (error) =>
          toast.error(
            getVisitPlanErrorMessage(error, "Failed to approve visit plan")
          ),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Approve visit plan</DialogTitle>
          <DialogDescription>
            Optionally remove customers before approving. Removed customers stay
            on the plan, flagged with the note below. At least one customer must
            remain on every day.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {days.map((day) => {
            const selectedForDay = selected[day.date] ?? []
            return (
              <div key={day.date} className="rounded-lg border">
                <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2">
                  <span className="text-sm font-medium">
                    {formatVisitPlanDate(day.date)}
                  </span>
                  {selectedForDay.length > 0 ? (
                    <span className="text-xs text-muted-foreground">
                      {selectedForDay.length} to remove
                    </span>
                  ) : null}
                </div>
                <ul className="divide-y">
                  {day.customers.map((customer) => (
                    <li
                      key={`${day.date}-${customer.customerUuid}`}
                      className="flex items-center gap-3 px-3 py-2 text-sm"
                    >
                      <Checkbox
                        checked={selectedForDay.includes(customer.customerUuid)}
                        disabled={
                          customer.removedByApprover ||
                          approveMutation.isPending
                        }
                        onCheckedChange={() =>
                          toggle(
                            day.date,
                            customer.customerUuid,
                            customer.removedByApprover
                          )
                        }
                        aria-label="Remove customer from this day"
                      />
                      <span className="min-w-0 flex-1">
                        <CustomerNameLabel
                          companyUuid={companyUuid}
                          customerUuid={customer.customerUuid}
                        />
                        {customer.removedByApprover ? (
                          <span className="block text-xs text-muted-foreground">
                            Already removed
                            {customer.removedNote
                              ? ` — ${customer.removedNote}`
                              : ""}
                          </span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}

          <Field data-invalid={!!noteError}>
            <FieldLabel>
              Note
              {removalCount > 0 ? (
                <span className="text-destructive">*</span>
              ) : null}
            </FieldLabel>
            <Textarea
              value={note}
              onChange={(event) => {
                setNote(event.target.value)
                setNoteError(null)
              }}
              placeholder="Reason for removing customers (required when removing)"
              maxLength={MAX_VISIT_PLAN_NOTE_LENGTH}
              disabled={approveMutation.isPending}
              aria-invalid={!!noteError}
            />
            <div className="flex items-center justify-between">
              <FieldError
                errors={[noteError ? { message: noteError } : undefined]}
              />
              <span className="text-xs text-muted-foreground">
                {note.length}/{MAX_VISIT_PLAN_NOTE_LENGTH}
              </span>
            </div>
          </Field>

          {dayError ? (
            <p
              role="alert"
              className="flex items-center gap-1.5 text-sm text-destructive"
            >
              <AlertCircle className="size-4 shrink-0" />
              {dayError}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={approveMutation.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={approveMutation.isPending}>
            {approveMutation.isPending ? (
              <Spinner className="mr-2 size-4" />
            ) : null}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
