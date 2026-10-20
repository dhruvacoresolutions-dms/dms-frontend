"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Landmark, Pencil, Plus } from "lucide-react"
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
  FormTextField,
  requiredLabel,
} from "@/components/common/form-fields"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { applyApiFieldErrors } from "@/lib/api/form-errors"
import { optionalText, requiredText } from "@/lib/validations/master-data"
import { PERMISSIONS } from "@/lib/permissions"
import { useCustomerBank } from "../hooks/use-customer-bank"
import { useUpsertCustomerBank } from "../hooks/use-upsert-customer-bank"
import {
  customerBankAccount,
  customerIfsc,
} from "../lib/customer-validation"

const bankSchema = z.object({
  // `CustomerLifecycleModels.Bank` uses `@NotBlank @Size(max=150)` only — bank
  // and branch names legitimately contain punctuation ("HDFC Bank Ltd.").
  accountHolder: requiredText("Account holder", 150),
  bankName: requiredText("Bank name", 150),
  accountNumber: customerBankAccount(),
  ifsc: customerIfsc(),
  branch: requiredText("Branch", 150),
  upiId: optionalText("UPI ID", 200),
})

type BankFormValues = z.infer<typeof bankSchema>

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value || "—"}</dd>
    </div>
  )
}

type Props = {
  companyUuid: string
  customerUuid: string
  /** Customer row version — bank writes lock the customer row. */
  customerVersion: number
  /** Bank data can only be changed while the customer is DRAFT/REWORK. */
  editable: boolean
}

export function CustomerBankSection({
  companyUuid,
  customerUuid,
  customerVersion,
  editable,
}: Props) {
  const { data: account, isLoading, error, refetch } = useCustomerBank(
    companyUuid,
    customerUuid
  )
  const upsertMutation = useUpsertCustomerBank(companyUuid)
  const [open, setOpen] = useState(false)

  const { control, handleSubmit, reset, setError } = useForm<BankFormValues>({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      accountHolder: "",
      bankName: "",
      accountNumber: "",
      ifsc: "",
      branch: "",
      upiId: "",
    },
  })

  useEffect(() => {
    if (!open) return
    reset({
      accountHolder: account?.accountHolder ?? "",
      bankName: account?.bankName ?? "",
      // Write-only: never pre-fill the masked number.
      accountNumber: "",
      ifsc: account?.ifsc ?? "",
      branch: account?.branch ?? "",
      upiId: account?.upiId ?? "",
    })
  }, [open, account, reset])

  const onSubmit = (values: BankFormValues) => {
    upsertMutation.mutate(
      {
        customerUuid,
        input: {
          accountHolder: values.accountHolder.trim(),
          bankName: values.bankName.trim(),
          accountNumber: values.accountNumber.trim(),
          ifsc: values.ifsc.trim().toUpperCase(),
          branch: values.branch.trim(),
          upiId: values.upiId?.trim() || undefined,
          version: customerVersion,
        },
      },
      {
        onSuccess: () => {
          toast.success("Bank account saved")
          setOpen(false)
        },
        onError: (err) => {
          applyApiFieldErrors(err, setError)
          toast.error(getApiErrorMessage(err, "Failed to save bank account"))
        },
      }
    )
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="size-5" /> Bank Account
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Settlement account used for payouts and collections.
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
                : "Bank details can only be edited while the customer is in DRAFT or REWORK."
            }
          >
            {account ? (
              <Pencil className="mr-2 size-4" />
            ) : (
              <Plus className="mr-2 size-4" />
            )}
            {account ? "Edit" : "Add account"}
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
              {getApiErrorMessage(error, "Failed to load bank account")}
            </p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        ) : !account ? (
          <p className="text-sm text-muted-foreground">
            No bank account on record yet.
          </p>
        ) : (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Bank Name" value={account.bankName} />
            <Field label="Account Holder" value={account.accountHolder} />
            <Field label="Account Number" value={account.accountNumber} />
            <Field label="IFSC" value={account.ifsc} />
            <Field label="Branch" value={account.branch} />
            <Field label="UPI ID" value={account.upiId} />
          </dl>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{account ? "Edit bank account" : "Add bank account"}</DialogTitle>
            <DialogDescription>
              The account number is write-only; re-enter it on every save.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <FieldGroup>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormTextField
                  control={control}
                  name="bankName"
                  label={requiredLabel("Bank Name")}
                  maxLength={150}
                />
                <FormTextField
                  control={control}
                  name="accountHolder"
                  label={requiredLabel("Account Holder")}
                  maxLength={150}
                />
                <FormTextField
                  control={control}
                  name="accountNumber"
                  label={requiredLabel("Account Number")}
                  maxLength={20}
                  autoComplete="off"
                  placeholder="6-20 digits"
                />
                <FormTextField
                  control={control}
                  name="ifsc"
                  label={requiredLabel("IFSC")}
                  maxLength={11}
                  placeholder="HDFC0001234"
                />
                <FormTextField
                  control={control}
                  name="branch"
                  label={requiredLabel("Branch")}
                  maxLength={150}
                />
                <FormTextField
                  control={control}
                  name="upiId"
                  label="UPI ID"
                  maxLength={200}
                  placeholder="shop@upi"
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
                {upsertMutation.isPending ? "Saving..." : "Save account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
