"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { useGstHsn } from "../hooks/use-gst-hsn"
import { useCreateGstHsn } from "../hooks/use-create-gst-hsn"
import { useUpdateGstHsn } from "../hooks/use-update-gst-hsn"

const hsnSchema = z.object({
  hsnCode: z.string().min(1, "HSN code is required").max(20),
  description: z.string().max(500).optional(),
  effectiveFrom: z.string().optional(),
  effectiveTo: z.string().optional(),
  gstProductType: z.string().max(50).optional(),
})

type HsnFormValues = z.infer<typeof hsnSchema>

type GstHsnFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  /** When set, the dialog edits that HSN; otherwise it creates one */
  hsnUuid?: string | null
}

function toFormDefaults(): HsnFormValues {
  return {
    hsnCode: "",
    description: "",
    effectiveFrom: "",
    effectiveTo: "",
    gstProductType: "",
  }
}

export function GstHsnFormDialog({
  open,
  onOpenChange,
  companyUuid,
  hsnUuid,
}: GstHsnFormDialogProps) {
  const isEdit = !!hsnUuid
  const { data: hsn, isLoading: isDetailLoading } = useGstHsn(
    companyUuid,
    hsnUuid ?? ""
  )
  const createMutation = useCreateGstHsn(companyUuid)
  const updateMutation = useUpdateGstHsn(companyUuid)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HsnFormValues>({
    resolver: zodResolver(hsnSchema),
    defaultValues: toFormDefaults(),
  })

  useEffect(() => {
    if (!open) return
    if (isEdit) {
      if (hsn) {
        reset({
          hsnCode: hsn.hsnCode,
          description: hsn.description ?? "",
          effectiveFrom: hsn.effectiveFrom ?? "",
          effectiveTo: hsn.effectiveTo ?? "",
          gstProductType: hsn.gstProductType ?? "",
        })
      }
    } else {
      reset(toFormDefaults())
    }
  }, [open, isEdit, hsn, reset])

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    (isEdit && isDetailLoading)

  const emptyToUndefined = (v?: string) => (v?.trim() ? v.trim() : undefined)

  const onSubmit = (values: HsnFormValues) => {
    if (isEdit) {
      if (!hsnUuid) return
      // Backend PUT: hsnCode is immutable; send the mutable fields + version
      // for optimistic locking when known.
      updateMutation.mutate(
        {
          hsnUuid,
          input: {
            description: emptyToUndefined(values.description),
            effectiveFrom: emptyToUndefined(values.effectiveFrom),
            effectiveTo: emptyToUndefined(values.effectiveTo) ?? null,
            gstProductType: emptyToUndefined(values.gstProductType),
            ...(typeof hsn?.version === "number"
              ? { version: hsn.version }
              : {}),
          },
        },
        {
          onSuccess: () => {
            toast.success("GST HSN updated")
            handleOpenChange(false)
          },
          onError: (error) => {
            toast.error(getApiErrorMessage(error, "Failed"))
          },
        }
      )
      return
    }
    createMutation.mutate(
      {
        hsnCode: values.hsnCode.trim(),
        description: emptyToUndefined(values.description),
        effectiveFrom: emptyToUndefined(values.effectiveFrom),
        effectiveTo: emptyToUndefined(values.effectiveTo) ?? null,
        gstProductType: emptyToUndefined(values.gstProductType),
      },
      {
        onSuccess: () => {
          toast.success("GST HSN created")
          reset(toFormDefaults())
          handleOpenChange(false)
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error, "Failed"))
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit GST HSN" : "Create GST HSN"}
          </DialogTitle>
        </DialogHeader>
        {isEdit && isDetailLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FieldGroup>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Field>
                  <FieldLabel>HSN Code</FieldLabel>
                  <Input
                    placeholder="e.g. 8708301000"
                    aria-invalid={!!errors.hsnCode}
                    {...register("hsnCode")}
                    disabled={isEdit}
                    autoComplete="off"
                  />
                  {isEdit && (
                    <p className="text-xs text-muted-foreground">
                      HSN code cannot be changed after creation.
                    </p>
                  )}
                  <FieldError errors={[errors.hsnCode]} />
                </Field>
                <Field>
                  <FieldLabel>Product Type</FieldLabel>
                  <Input
                    placeholder="e.g. PARTS"
                    aria-invalid={!!errors.gstProductType}
                    {...register("gstProductType")}
                    autoComplete="off"
                  />
                  <FieldError errors={[errors.gstProductType]} />
                </Field>
                <Field>
                  <FieldLabel>Effective From</FieldLabel>
                  <Input
                    type="date"
                    aria-invalid={!!errors.effectiveFrom}
                    {...register("effectiveFrom")}
                  />
                  <FieldError errors={[errors.effectiveFrom]} />
                </Field>
                <Field>
                  <FieldLabel>Effective To</FieldLabel>
                  <Input
                    type="date"
                    aria-invalid={!!errors.effectiveTo}
                    {...register("effectiveTo")}
                  />
                  <FieldError errors={[errors.effectiveTo]} />
                </Field>
                <Field className="lg:col-span-2">
                  <FieldLabel>Description</FieldLabel>
                  <Input
                    placeholder="Optional"
                    {...register("description")}
                  />
                  <FieldError errors={[errors.description]} />
                </Field>
              </div>
            </FieldGroup>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? isEdit
                    ? "Saving..."
                    : "Creating..."
                  : isEdit
                    ? "Save changes"
                    : "Create"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
