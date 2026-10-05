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
import { Spinner } from "@/components/ui/spinner"
import { FormTextField } from "@/components/common/form-fields"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { useRelationshipType } from "../hooks/use-relationship-type"
import { useCreateRelationshipType } from "../hooks/use-create-relationship-type"
import { useUpdateRelationshipType } from "../hooks/use-update-relationship-type"

const relationshipTypeSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(50)
    .regex(/^[A-Za-z0-9_-]+$/, "Invalid code"),
  name: z.string().min(1, "Name is required").max(160),
})

type RelationshipTypeFormValues = z.infer<typeof relationshipTypeSchema>

type RelationshipTypeFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  /** When set, the dialog edits that relationship type; otherwise it creates one */
  relationshipTypeUuid?: string | null
}

export function RelationshipTypeFormDialog({
  open,
  onOpenChange,
  companyUuid,
  relationshipTypeUuid,
}: RelationshipTypeFormDialogProps) {
  const isEdit = !!relationshipTypeUuid
  const { data: relationshipType, isLoading: isDetailLoading } =
    useRelationshipType(companyUuid, relationshipTypeUuid ?? "")
  const createMutation = useCreateRelationshipType(companyUuid)
  const updateMutation = useUpdateRelationshipType(companyUuid)

  const { handleSubmit, control, reset } =
    useForm<RelationshipTypeFormValues>({
      resolver: zodResolver(relationshipTypeSchema),
      defaultValues: { code: "", name: "" },
    })

  useEffect(() => {
    if (!open) return
    if (isEdit) {
      if (relationshipType) {
        reset({
          code: relationshipType.code,
          name: relationshipType.name,
        })
      }
    } else {
      reset({ code: "", name: "" })
    }
  }, [open, isEdit, relationshipType, reset])

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    (isEdit && isDetailLoading)

  const onSubmit = (values: RelationshipTypeFormValues) => {
    if (isEdit) {
      if (!relationshipTypeUuid) return
      updateMutation.mutate(
        {
          relationshipTypeUuid,
          input: {
            name: values.name,
            ...(relationshipType?.version !== undefined
              ? { version: relationshipType.version }
              : {}),
          },
        },
        {
          onSuccess: () => {
            toast.success("Relationship type updated")
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
      { code: values.code, name: values.name },
      {
        onSuccess: () => {
          toast.success("Relationship type created")
          reset({ code: "", name: "" })
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Relationship Type" : "Create Relationship Type"}
          </DialogTitle>
        </DialogHeader>
        {isEdit && isDetailLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FieldGroup>
              <div className="grid grid-cols-1 gap-4">
                <FormTextField
                  control={control}
                  name="code"
                  label="Code"
                  disabled={isEdit}
                />
                <FormTextField control={control} name="name" label="Name" />
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
