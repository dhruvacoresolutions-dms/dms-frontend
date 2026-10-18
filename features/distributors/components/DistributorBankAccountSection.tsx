"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Landmark, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FieldGroup } from "@/components/ui/field"
import { FormSelectField, FormTextField } from "@/components/common/form-fields"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { PERMISSIONS } from "@/lib/permissions"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { useDistributorBankAccount } from "../hooks/use-distributor-bank-account"
import { useUpsertDistributorBankAccount } from "../hooks/use-upsert-distributor-bank-account"
import type { BankAccountType } from "../api/distributor.types"

const ACCOUNT_TYPES: { value: BankAccountType; label: string }[] = [
  { value: "SAVINGS", label: "Savings" },
  { value: "CURRENT", label: "Current" },
  { value: "OD", label: "Overdraft (OD)" },
  { value: "CC", label: "Cash Credit (CC)" },
]

const bankSchema = z.object({
  bankName: z.string().min(1, "Bank name is required").max(150),
  accountHolderName: z.string().min(1, "Account holder is required").max(150),
  accountNumber: z.string().min(1, "Account number is required").max(34),
  ifscCode: z.string().max(11).optional(),
  branchName: z.string().max(150).optional(),
  accountType: z.enum(["SAVINGS", "CURRENT", "OD", "CC"]),
})

type BankFormValues = z.infer<typeof bankSchema>

type Props = {
  companyUuid: string
  distributorUuid: string
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value || "—"}</dd>
    </div>
  )
}

export function DistributorBankAccountSection({
  companyUuid,
  distributorUuid,
}: Props) {
  const { data, isLoading, error, refetch } = useDistributorBankAccount(
    companyUuid,
    distributorUuid
  )
  const upsertMutation = useUpsertDistributorBankAccount(
    companyUuid,
    distributorUuid
  )
  const [open, setOpen] = useState(false)

  const account = data?.bankAccount ?? null

  const { handleSubmit, control, reset } = useForm<BankFormValues>({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      bankName: "",
      accountHolderName: "",
      accountNumber: "",
      ifscCode: "",
      branchName: "",
      accountType: "CURRENT",
    },
  })

  useEffect(() => {
    if (!open) return
    reset({
      bankName: account?.bankName ?? "",
      accountHolderName: account?.accountHolderName ?? "",
      accountNumber: "",
      ifscCode: account?.ifscCode ?? "",
      branchName: account?.branchName ?? "",
      accountType: account?.accountType ?? "CURRENT",
    })
  }, [open, account, reset])

  const onSubmit = (values: BankFormValues) => {
    upsertMutation.mutate(
      {
        bankName: values.bankName.trim(),
        accountHolderName: values.accountHolderName.trim(),
        accountNumber: values.accountNumber.trim(),
        ifscCode: values.ifscCode?.trim() || undefined,
        branchName: values.branchName?.trim() || undefined,
        accountType: values.accountType,
        version: account?.version,
      },
      {
        onSuccess: () => {
          toast.success("Bank account saved")
          setOpen(false)
        },
        onError: (err) => toast.error(getApiErrorMessage(err, "Failed")),
      }
    )
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2">
          <Landmark className="size-5" /> Bank Account
        </CardTitle>
        <PermissionGate permission={PERMISSIONS.DISTRIBUTOR.BANK_UPDATE}>
          <Button
            variant="outline"
            onClick={() => setOpen(true)}
            disabled={isLoading || !!error}
          >
            <Pencil className="mr-2 size-4" />
            {account ? "Edit" : "Add"}
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
            No bank account on record.
            {data?.bankAccountRequired
              ? " A bank account is required for this distributor."
              : ""}
          </p>
        ) : (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <Field label="Bank Name" value={account.bankName} />
            <Field label="Account Holder" value={account.accountHolderName} />
            <Field label="Account Number" value={account.accountNumber} />
            <Field label="IFSC Code" value={account.ifscCode} />
            <Field label="Branch" value={account.branchName} />
            <Field label="Account Type" value={account.accountType} />
          </dl>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Bank Account</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FieldGroup>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <FormTextField
                  control={control}
                  name="bankName"
                  label="Bank Name *"
                  maxLength={150}
                />
                <FormTextField
                  control={control}
                  name="accountHolderName"
                  label="Account Holder *"
                  maxLength={150}
                />
                <FormTextField
                  control={control}
                  name="accountNumber"
                  label="Account Number *"
                  maxLength={34}
                  autoComplete="off"
                />
                <FormTextField
                  control={control}
                  name="ifscCode"
                  label="IFSC Code"
                  maxLength={11}
                />
                <FormTextField
                  control={control}
                  name="branchName"
                  label="Branch"
                  maxLength={150}
                />
                <FormSelectField
                  control={control}
                  name="accountType"
                  label="Account Type"
                  options={ACCOUNT_TYPES}
                />
              </div>
            </FieldGroup>
            <p className="text-xs text-muted-foreground">
              The account number is write-only and must be re-entered on every save.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
