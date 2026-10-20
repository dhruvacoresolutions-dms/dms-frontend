"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Pencil, Plus, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import {
  FormNumberField,
  requiredLabel,
} from "@/components/common/form-fields"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { applyApiFieldErrors } from "@/lib/api/form-errors"
import { PERMISSIONS } from "@/lib/permissions"
import { useCustomerCredit } from "../hooks/use-customer-credit"
import { useUpsertCustomerCredit } from "../hooks/use-upsert-customer-credit"

const creditSchema = z.object({
  // Mirrors `CustomerLifecycleModels.Credit`: creditLimit @NotNull @DecimalMin(0),
  // creditDays @NotNull @Min(0) @Max(365), openingBalance unconstrained.
  creditLimit: z.coerce
    .number({
      required_error: "Credit limit is required",
      invalid_type_error: "Credit limit is required",
    })
    .min(0, "Credit limit cannot be negative"),
  creditDays: z.coerce
    .number({
      required_error: "Credit days are required",
      invalid_type_error: "Credit days are required",
    })
    .int("Credit days must be a whole number")
    .min(0, "Credit days cannot be negative")
    .max(365, "Credit days cannot exceed 365"),
  // Negative opening balances are valid (customer advance) and allowed by the API.
  openingBalance: z.coerce
    .number({ invalid_type_error: "Enter a valid amount" })
    .optional(),
})

type CreditFormValues = z.infer<typeof creditSchema>

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
})

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value || "—"}</dd>
    </div>
  )
}

type Props = {
  companyUuid: string
  customerUuid: string
  /** Customer row version — credit writes lock the customer row. */
  customerVersion: number
  editable: boolean
}

export function CustomerCreditSection({
  companyUuid,
  customerUuid,
  customerVersion,
  editable,
}: Props) {
  const { data: credit, isLoading, error, refetch } = useCustomerCredit(
    companyUuid,
    customerUuid
  )
  const upsertMutation = useUpsertCustomerCredit(companyUuid)
  const [open, setOpen] = useState(false)

  const { control, handleSubmit, reset, setError } = useForm<CreditFormValues>(
    {
      resolver: zodResolver(creditSchema),
      defaultValues: {
        creditLimit: 0,
        creditDays: 0,
        openingBalance: undefined,
      },
    }
  )

  useEffect(() => {
    if (!open) return
    reset({
      creditLimit: credit?.creditLimit ?? 0,
      creditDays: credit?.creditDays ?? 0,
      openingBalance: credit?.openingBalance ?? undefined,
    })
  }, [open, credit, reset])

  const onSubmit = (values: CreditFormValues) => {
    upsertMutation.mutate(
      {
        customerUuid,
        input: {
          creditLimit: values.creditLimit,
          creditDays: values.creditDays,
          openingBalance: values.openingBalance,
          version: customerVersion,
        },
      },
      {
        onSuccess: () => {
          toast.success("Credit terms saved")
          setOpen(false)
        },
        onError: (err) => {
          applyApiFieldErrors(err, setError)
          toast.error(getApiErrorMessage(err, "Failed to save credit terms"))
        },
      }
    )
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="size-5" /> Credit Terms
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Credit limit, payment window and opening balance for this outlet.
          </p>
        </div>
        <PermissionGate permission={PERMISSIONS.CUSTOMER.UPDATE}>
          <Button
            variant="outline"
            onClick={() => setOpen(true)}
            disabled={!editable || isLoading || !!error}
            title={
              editable
                ? undefined
                : "Credit terms can only be edited while the customer is in DRAFT or REWORK."
            }
          >
            {credit ? (
              <Pencil className="mr-2 size-4" />
            ) : (
              <Plus className="mr-2 size-4" />
            )}
            {credit ? "Edit" : "Add credit"}
          </Button>
        </PermissionGate>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Spinner />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-4 text-sm">
            <p className="text-muted-foreground">
              {getApiErrorMessage(error, "Failed to load credit terms")}
            </p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        ) : !credit ? (
          <p className="text-sm text-muted-foreground">
            No credit terms configured yet. Customers without credit terms are
            treated as cash-only.
          </p>
        ) : (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <Field label="Credit Limit" value={inr.format(credit.creditLimit)} />
            <Field label="Credit Days" value={`${credit.creditDays} days`} />
            <Field
              label="Opening Balance"
              value={
                credit.openingBalance != null
                  ? inr.format(credit.openingBalance)
                  : undefined
              }
            />
          </dl>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {credit ? "Edit credit terms" : "Add credit terms"}
            </DialogTitle>
            <DialogDescription>
              Applies to future orders. Existing invoices are not recalculated.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <FieldGroup>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormNumberField
                  control={control}
                  name="creditLimit"
                  label={requiredLabel("Credit Limit (₹)")}
                  min={0}
                />
                <FormNumberField
                  control={control}
                  name="creditDays"
                  label={requiredLabel("Credit Days")}
                  min={0}
                />
                <FormNumberField
                  control={control}
                  name="openingBalance"
                  label="Opening Balance (₹)"
                  min={0}
                />
              </div>
            </FieldGroup>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? "Saving..." : "Save terms"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
