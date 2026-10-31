"use client"

import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Attachment,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentActions,
  AttachmentAction,
} from "@/components/ui/attachment"
import { FileText, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FieldGroup } from "@/components/ui/field"
import { FormTextField, requiredLabel } from "@/components/common/form-fields"
import { Dropzone } from "@/components/common/Dropzone"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { applyApiFieldErrors } from "@/lib/api/form-errors"
import {
  customerBankAccount,
  customerIfsc,
  optionalAccountType,
} from "../lib/customer-validation"
import { useAddCustomerBankEntry } from "../hooks/use-add-customer-bank-entry"
import { INDIAN_BANKS, ACCOUNT_TYPES } from "@/lib/constants/indian-banks"
import { EntityCombobox } from "@/components/common/EntityCombobox"
import * as React from "react"

const bankSchema = z.object({
  // Mirrors `CustomerLifecycleModels.Bank` / `CustomerEntryModels.BankInput`.
  accountHolder: z
    .string()
    .trim()
    .min(1, "Account holder is required")
    .max(150, "Account holder must not exceed 150 characters"),
  bankName: z
    .string()
    .trim()
    .min(1, "Bank name is required")
    .max(150, "Bank name must not exceed 150 characters"),
  accountNumber: customerBankAccount(),
  ifsc: customerIfsc(),
  branch: z
    .string()
    .trim()
    .max(150, "Branch must not exceed 150 characters")
    .optional(),
  accountType: optionalAccountType(),
})

type BankFormValues = z.infer<typeof bankSchema>

const emptyValues: BankFormValues = {
  accountHolder: "",
  bankName: "",
  accountNumber: "",
  ifsc: "",
  branch: "",
  accountType: "",
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  customerUuid: string
}

/**
 * Adds a PENDING bank entry (`POST …/bank-entries`, multipart). Only one
 * PENDING/VERIFIED entry may exist, so the caller hides this when one is
 * already active. An optional proof (PNG/JPEG/PDF, max 5 MB) is stored as the
 * entry's `proofFileUuid`.
 */
export function CustomerBankEntryDialog({
  open,
  onOpenChange,
  companyUuid,
  customerUuid,
}: Props) {
  const addMutation = useAddCustomerBankEntry(companyUuid)
  const [proof, setProof] = useState<File | null>(null)
  const { control, handleSubmit, reset, setError, setValue } = useForm<BankFormValues>({
    resolver: zodResolver(bankSchema),
    defaultValues: emptyValues,
  })

  const bankNameValue = useWatch({ control, name: "bankName" })
  const accountTypeValue = useWatch({ control, name: "accountType" })

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      reset(emptyValues)
      setProof(null)
    }
    onOpenChange(next)
  }

  // Display the selected file name or uploader
  const proofDisplay = proof ? (
    <Attachment>
      <AttachmentMedia variant="icon">
        <FileText className="size-4" />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{proof.name}</AttachmentTitle>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction
          variant="ghost"
          size="icon-xs"
          onClick={() => setProof(null)}
          aria-label="Clear attached proof"
        >
          <X className="size-3.5" />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  ) : (
    <Dropzone
      accept="image/png,image/jpeg,application/pdf"
      maxSize={5 * 1024 * 1024}
      value={proof}
      onFileSelect={setProof}
      compact
      label="Attach bank proof"
      description="Cancelled cheque or statement — PNG, JPEG or PDF up to 5 MB"
      placeholder="No proof attached"
    />
  )

  const onSubmit = (values: BankFormValues) => {
    addMutation.mutate(
      {
        customerUuid,
        input: {
          accountHolder: values.accountHolder.trim(),
          bankName: values.bankName.trim(),
          accountNumber: values.accountNumber.trim(),
          ifsc: values.ifsc.trim().toUpperCase(),
          branch: values.branch?.trim() || undefined,
          accountType: values.accountType?.trim() || undefined,
        },
        proof,
      },
      {
        onSuccess: () => {
          toast.success("Bank account added for verification")
          handleOpenChange(false)
        },
        onError: (error) => {
          applyApiFieldErrors(error, setError)
          toast.error(getApiErrorMessage(error, "Failed to add bank account"))
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add bank account</DialogTitle>
          <DialogDescription>
            The account is created as a PENDING entry. A reviewer verifies it
            before the customer can be approved.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FieldGroup>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormTextField
                control={control}
                name="accountHolder"
                label={requiredLabel("Account Holder")}
                maxLength={150}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">
                  {requiredLabel("Bank Name")}
                </label>
                <EntityCombobox
                  companyUuid={companyUuid}
                  value={bankNameValue}
                  onValueChange={(nextId) => {
                    setValue("bankName", nextId ?? "")
                  }}
                  placeholder="Select bank name..."
                  options={INDIAN_BANKS.map((bank) => ({
                    id: bank,
                    label: bank,
                  }))}
                  selectedOption={
                    bankNameValue
                      ? { id: bankNameValue, label: bankNameValue }
                      : null
                  }
                  filter={(item, inputValue) =>
                    item.label.toLowerCase().includes(inputValue.toLowerCase())
                  }
                />
              </div>
              <FormTextField
                control={control}
                name="accountNumber"
                label={requiredLabel("Account Number")}
                maxLength={18}
                placeholder="9–18 digits"
                autoComplete="off"
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
                label="Branch"
                maxLength={150}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">
                  Account Type
                </label>
                <EntityCombobox
                  companyUuid={companyUuid}
                  value={accountTypeValue}
                  onValueChange={(nextId) => {
                    setValue("accountType", nextId ?? "")
                  }}
                  placeholder="Select account type..."
                  options={ACCOUNT_TYPES.map((type) => ({
                    id: type,
                    label: type,
                  }))}
                  selectedOption={
                    accountTypeValue
                      ? { id: accountTypeValue, label: accountTypeValue }
                      : null
                  }
                  filter={(item, inputValue) =>
                    item.label.toLowerCase().includes(inputValue.toLowerCase())
                  }
                />
              </div>
            </div>
          </FieldGroup>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Bank proof</span>
            {proofDisplay}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addMutation.isPending}>
              {addMutation.isPending ? "Adding..." : "Add account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}