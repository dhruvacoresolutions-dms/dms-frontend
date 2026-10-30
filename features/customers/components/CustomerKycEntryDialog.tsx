"use client"

import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Attachment, AttachmentMedia, AttachmentContent, AttachmentTitle, AttachmentActions, AttachmentAction } from "@/components/ui/attachment"
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
import { Dropzone } from "@/components/common/Dropzone"
import { FormSelectField, FormTextField, requiredLabel } from "@/components/common/form-fields"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { applyApiFieldErrors } from "@/lib/api/form-errors"
import {
  CUSTOMER_KYC_DOC_TYPES,
  customerHolderName,
  customerKycNumberMessage,
  customerKycNumberPattern,
} from "../lib/customer-validation"
import { useAddCustomerKycEntry } from "../hooks/use-add-customer-kyc-entry"
import type { CustomerKycDocType } from "../api/customer.types"

const kycSchema = z
  .object({
    docType: z.string().min(1, "Document type is required"),
    number: z.string().trim().min(1, "Document number is required"),
    holderFirstName: customerHolderName("Holder first name"),
    holderLastName: customerHolderName("Holder last name"),
  })
  .superRefine((values, ctx) => {
    if (!values.docType) return
    const type = values.docType as CustomerKycDocType
    if (!customerKycNumberPattern(type).test(values.number.trim().toUpperCase())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["number"],
        message: customerKycNumberMessage(type),
      })
    }
  })

type KycFormValues = z.infer<typeof kycSchema>

const emptyValues: KycFormValues = {
  docType: "",
  number: "",
  holderFirstName: "",
  holderLastName: "",
}

const TYPE_OPTIONS = CUSTOMER_KYC_DOC_TYPES.map((type) => ({
  value: type.value,
  label: type.label,
}))

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  customerUuid: string
}

/**
 * Adds a PENDING KYC entry (`POST …/kyc-entries`, multipart). The number is
 * masked by the API; holder names are required. An optional document part
 * (PNG/JPEG/PDF, max 5 MB) becomes the entry's proof.
 */
export function CustomerKycEntryDialog({
  open,
  onOpenChange,
  companyUuid,
  customerUuid,
}: Props) {
  const addMutation = useAddCustomerKycEntry(companyUuid)
  const [file, setFile] = useState<File | null>(null)

  const { control, handleSubmit, reset, setError } = useForm<KycFormValues>({
    resolver: zodResolver(kycSchema),
    defaultValues: emptyValues,
  })

  const docType = useWatch({ control, name: "docType" })
  const placeholder =
    CUSTOMER_KYC_DOC_TYPES.find((type) => type.value === docType)?.placeholder ??
    "Document number"

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      reset(emptyValues)
      setFile(null)
    }
    onOpenChange(next)
  }

  // Display the selected file name or uploader
  const fileDisplay = file ? (
    <Attachment>
      <AttachmentMedia variant="icon">
        <FileText className="size-4" />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{file.name}</AttachmentTitle>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction
          variant="ghost"
          size="icon-xs"
          onClick={() => setFile(null)}
          aria-label="Clear attached document"
        >
          <X className="size-3.5" />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  ) : (
    <Dropzone
      accept="image/png,image/jpeg,application/pdf"
      maxSize={5 * 1024 * 1024}
      value={file}
      onFileSelect={setFile}
      compact
      label="Attach document"
      description="PNG, JPEG or PDF up to 5 MB"
      placeholder="No document attached"
    />
  )

  const onSubmit = (values: KycFormValues) => {
    addMutation.mutate(
      {
        customerUuid,
        input: {
          docType: values.docType as CustomerKycDocType,
          number: values.number.trim().toUpperCase(),
          holderFirstName: values.holderFirstName.trim(),
          holderLastName: values.holderLastName.trim(),
        },
        document: file,
      },
      {
        onSuccess: () => {
          toast.success("KYC entry added for verification")
          handleOpenChange(false)
        },
        onError: (error) => {
          applyApiFieldErrors(error, setError)
          toast.error(getApiErrorMessage(error, "Failed to add KYC entry"))
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add KYC document</DialogTitle>
          <DialogDescription>
            The entry starts as PENDING. A reviewer verifies or rejects it, and
            one entry per document type may be active at a time.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FieldGroup>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormSelectField
                control={control}
                name="docType"
                label={requiredLabel("Document Type")}
                options={TYPE_OPTIONS}
                placeholder="Select document type..."
              />
              <FormTextField
                control={control}
                name="number"
                label={requiredLabel("Document Number")}
                maxLength={20}
                placeholder={placeholder}
                autoComplete="off"
              />
              <FormTextField
                control={control}
                name="holderFirstName"
                label={requiredLabel("Holder First Name")}
                maxLength={100}
              />
              <FormTextField
                control={control}
                name="holderLastName"
                label={requiredLabel("Holder Last Name")}
                maxLength={100}
              />
            </div>
          </FieldGroup>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Document proof</span>
            {fileDisplay}
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
              {addMutation.isPending ? "Adding..." : "Add document"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
