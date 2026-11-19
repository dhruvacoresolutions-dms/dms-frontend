"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CheckCircle2, Info, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import {
  FormTextareaField,
  requiredLabel,
} from "@/components/common/form-fields"
import type { StockDocument } from "../api/inventory.types"

const decisionSchema = z.object({
  remarks: z
    .string()
    .trim()
    .min(1, "Remarks are required")
    .max(1000, "Remarks must not exceed 1000 characters"),
})

type DecisionValues = z.infer<typeof decisionSchema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "approve" | "reject"
  document: Pick<StockDocument, "uuid" | "referenceNo" | "version"> | null
  isPending?: boolean
  onConfirm: (remarks: string) => void
}

/**
 * Approve/reject a PENDING stock document. The backend requires non-blank
 * approval remarks on `/approval`, and rejection remarks on `/reject`.
 */
export function StockDecisionDialog({
  open,
  onOpenChange,
  mode,
  document,
  isPending = false,
  onConfirm,
}: Props) {
  const isApprove = mode === "approve"
  const { control, handleSubmit, reset } = useForm<DecisionValues>({
    resolver: zodResolver(decisionSchema),
    defaultValues: { remarks: "" },
  })

  useEffect(() => {
    if (open) reset({ remarks: "" })
  }, [open, reset])

  const submit = (values: DecisionValues) => {
    onConfirm(values.remarks.trim())
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isApprove ? (
              <CheckCircle2 className="size-4 text-green-600" aria-hidden="true" />
            ) : (
              <XCircle className="size-4 text-destructive" aria-hidden="true" />
            )}
            {isApprove ? "Approve document" : "Reject document"}
          </DialogTitle>
          <DialogDescription>
            {document?.referenceNo
              ? `${isApprove ? "Approving" : "Rejecting"} ${document.referenceNo}.`
              : "This action cannot be undone."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {isApprove
            ? "Approval posts the stock movements immediately. A PENDING document does not affect balances until it is approved."
            : "Rejection does not post stock. The document stays in the history as REJECTED."}
        </div>

        <form
          onSubmit={handleSubmit(submit)}
          className="flex flex-col gap-4"
          noValidate
        >
          <FormTextareaField
            control={control}
            name="remarks"
            label={requiredLabel(
              isApprove ? "Approval remarks" : "Rejection remarks"
            )}
            placeholder={
              isApprove
                ? "Enter a note for the approval"
                : "Explain why this document is rejected"
            }
            disabled={isPending}
            rows={3}
            maxLength={1000}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={isApprove ? "default" : "destructive"}
              disabled={isPending || !document}
            >
              {isPending ? <Spinner className="mr-2 size-4" /> : null}
              {isApprove ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
