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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FieldGroup } from "@/components/ui/field"
import {
  FormSwitchField,
  FormTextareaField,
  FormTextField,
} from "@/components/common/form-fields"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { useCreateDistributorReference } from "../hooks/use-create-distributor-reference"
import { useUpdateDistributorReference } from "../hooks/use-update-distributor-reference"
import type {
  DistributorReferenceKind,
  DistributorReferenceResponse,
} from "../api/distributor-reference.types"

const referenceSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(40)
    .regex(/^[A-Za-z0-9._-]+$/, "Only letters, numbers, dot, underscore, hyphen"),
  name: z.string().min(1, "Name is required").max(160),
  description: z.string().max(500).optional(),
  requiresParent: z.boolean(),
})

type ReferenceFormValues = z.infer<typeof referenceSchema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  kind: DistributorReferenceKind
  /** Singular label, e.g. "Distributor Type" */
  singular: string
  reference?: DistributorReferenceResponse | null
}

export function DistributorReferenceFormDialog({
  open,
  onOpenChange,
  companyUuid,
  kind,
  singular,
  reference,
}: Props) {
  const isEdit = !!reference
  const createMutation = useCreateDistributorReference(companyUuid, kind)
  const updateMutation = useUpdateDistributorReference(companyUuid, kind)

  const { handleSubmit, control, reset } = useForm<ReferenceFormValues>({
    resolver: zodResolver(referenceSchema),
    defaultValues: { code: "", name: "", description: "", requiresParent: false },
  })

  useEffect(() => {
    if (!open) return
    if (reference) {
      reset({
        code: reference.code,
        name: reference.name,
        description: reference.description ?? "",
        requiresParent: reference.requiresParent ?? false,
      })
    } else {
      reset({ code: "", name: "", description: "", requiresParent: false })
    }
  }, [open, reference, reset])

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = (values: ReferenceFormValues) => {
    if (isEdit && reference) {
      updateMutation.mutate(
        {
          uuid: reference.uuid,
          input: {
            name: values.name.trim(),
            description: values.description?.trim() || undefined,
            requiresParent: values.requiresParent,
            version: reference.version,
          },
        },
        {
          onSuccess: () => {
            toast.success(`${singular} updated`)
            handleOpenChange(false)
          },
          onError: (error) => toast.error(getApiErrorMessage(error, "Failed")),
        }
      )
      return
    }

    createMutation.mutate(
      {
        code: values.code.trim(),
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        requiresParent: values.requiresParent,
      },
      {
        onSuccess: () => {
          toast.success(`${singular} created`)
          reset()
          handleOpenChange(false)
        },
        onError: (error) => toast.error(getApiErrorMessage(error, "Failed")),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Edit ${singular}` : `Create ${singular}`}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <FormTextField
                control={control}
                name="code"
                label="Code *"
                disabled={isEdit}
              />
              <FormTextField control={control} name="name" label="Name *" />
              <FormTextareaField
                control={control}
                name="description"
                label="Description"
                className="lg:col-span-2"
              />
              <FormSwitchField
                control={control}
                name="requiresParent"
                label="Requires Parent"
                className="lg:col-span-2"
              />
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
              {isPending ? "Saving..." : isEdit ? "Save changes" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
