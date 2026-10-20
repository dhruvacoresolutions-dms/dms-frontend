"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
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
import { FieldGroup } from "@/components/ui/field"
import {
  FormComboboxField,
  FormTextareaField,
  FormTextField,
  requiredLabel,
} from "@/components/common/form-fields"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { applyApiFieldErrors } from "@/lib/api/form-errors"
import {
  optionalText,
  requiredText,
} from "@/lib/validations/master-data"
import { CustomerLookupCombobox } from "./CustomerMasterCombobox"
import { useCreateCustomerKycDocument } from "../hooks/use-create-customer-kyc-document"
import { useUpdateCustomerKycDocument } from "../hooks/use-update-customer-kyc-document"
import type { CustomerKycDocument } from "../api/customer.types"

const kycSchema = z.object({
  kycDocumentTypeCode: z.string().min(1, "Document type is required"),
  documentNumber: requiredText("Document number", 150),
  remarks: optionalText("Remarks", 2000),
  fileRef: optionalText("File reference", 1000),
})

type KycFormValues = z.infer<typeof kycSchema>

const emptyValues: KycFormValues = {
  kycDocumentTypeCode: "",
  documentNumber: "",
  remarks: "",
  fileRef: "",
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  customerUuid: string
  /** Customer row version — KYC writes lock the customer row. */
  customerVersion: number
  document?: CustomerKycDocument | null
}

export function CustomerKycDocumentDialog({
  open,
  onOpenChange,
  companyUuid,
  customerUuid,
  customerVersion,
  document,
}: Props) {
  const isEdit = !!document
  const createMutation = useCreateCustomerKycDocument(companyUuid)
  const updateMutation = useUpdateCustomerKycDocument(companyUuid)

  const { control, handleSubmit, reset, setError } = useForm<KycFormValues>({
    resolver: zodResolver(kycSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (!open) return
    reset(
      document
        ? {
            kycDocumentTypeCode: document.kycDocumentTypeCode ?? "",
            documentNumber: document.documentNumber ?? "",
            remarks: document.remarks ?? "",
            fileRef: document.fileRef ?? "",
          }
        : emptyValues
    )
  }, [open, document, reset])

  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = (values: KycFormValues) => {
    const input = {
      kycDocumentTypeCode: values.kycDocumentTypeCode,
      documentNumber: values.documentNumber.trim(),
      remarks: values.remarks?.trim() || undefined,
      fileRef: values.fileRef?.trim() || undefined,
      version: customerVersion,
    }

    const onError = (err: unknown) => {
      applyApiFieldErrors(err, setError)
      toast.error(getApiErrorMessage(err, "Failed to save KYC document"))
    }

    if (isEdit && document) {
      updateMutation.mutate(
        { customerUuid, documentUuid: document.uuid, input },
        {
          onSuccess: () => {
            toast.success("KYC document updated")
            onOpenChange(false)
          },
          onError,
        }
      )
      return
    }

    createMutation.mutate(
      { customerUuid, input },
      {
        onSuccess: () => {
          toast.success("KYC document added")
          onOpenChange(false)
        },
        onError,
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit KYC document" : "Add KYC document"}
          </DialogTitle>
          <DialogDescription>
            Capture the document number and an optional file reference. The
            reviewer can verify or reject the document afterwards.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FieldGroup>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormComboboxField
                control={control}
                name="kycDocumentTypeCode"
                label={requiredLabel("Document Type")}
                companyUuid={companyUuid}
                Combobox={CustomerLookupCombobox}
                comboboxProps={{ lookupType: "KYC_DOCUMENT_TYPE" }}
              />
              <FormTextField
                control={control}
                name="documentNumber"
                label={requiredLabel("Document Number")}
                maxLength={150}
              />
              <FormTextField
                control={control}
                name="fileRef"
                label="File Reference"
                maxLength={1000}
                placeholder="Upload reference or document URL"
                className="sm:col-span-2"
              />
              <FormTextareaField
                control={control}
                name="remarks"
                label="Remarks"
                rows={3}
                className="sm:col-span-2"
              />
            </div>
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save document"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
