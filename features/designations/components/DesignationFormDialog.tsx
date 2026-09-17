"use client"

import * as React from "react"
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
import { useDesignation } from "../hooks/use-designation"
import { useCreateDesignation } from "../hooks/use-create-designation"
import { useUpdateDesignation } from "../hooks/use-update-designation"

const designationSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(50)
    .regex(/^[A-Za-z0-9_-]+$/, "Invalid code format"),
  name: z.string().min(1, "Name is required"),
  hierarchyLevel: z.coerce.number().int().min(1, "Hierarchy level required"),
  description: z.string().optional(),
})

type DesignationFormValues = z.infer<typeof designationSchema>

type DesignationFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  /** When set, the dialog edits that designation; otherwise it creates one */
  designationUuid?: string | null
}

export function DesignationFormDialog({
  open,
  onOpenChange,
  companyUuid,
  designationUuid,
}: DesignationFormDialogProps) {
  const isEdit = !!designationUuid
  const { data: designation, isLoading: isDetailLoading } = useDesignation(
    companyUuid,
    designationUuid ?? ""
  )
  const createMutation = useCreateDesignation(companyUuid)
  const updateMutation = useUpdateDesignation(companyUuid)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DesignationFormValues>({
    resolver: zodResolver(designationSchema),
    defaultValues: { code: "", name: "", hierarchyLevel: 10, description: "" },
  })

  React.useEffect(() => {
    if (!open) return
    if (isEdit) {
      if (designation) {
        reset({
          code: designation.code,
          name: designation.name,
          hierarchyLevel: designation.hierarchyLevel,
          description: designation.description ?? "",
        })
      }
    } else {
      reset({ code: "", name: "", hierarchyLevel: 10, description: "" })
    }
  }, [open, isEdit, designation, reset])

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    (isEdit && isDetailLoading)

  const onSubmit = (values: DesignationFormValues) => {
    if (isEdit) {
      if (!designationUuid) return
      // Backend PUT accepts only name, hierarchyLevel, description (code is immutable)
      updateMutation.mutate(
        {
          designationUuid,
          input: {
            name: values.name,
            hierarchyLevel: values.hierarchyLevel,
            description: values.description || undefined,
          },
        },
        {
          onSuccess: () => {
            toast.success("Designation updated")
            handleOpenChange(false)
          },
          onError: (error) => {
            toast.error(getApiErrorMessage(error, "Failed"))
          },
        }
      )
      return
    }
    createMutation.mutate(values, {
      onSuccess: () => {
        toast.success("Designation created")
        reset({ code: "", name: "", hierarchyLevel: 10, description: "" })
        handleOpenChange(false)
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, "Failed"))
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Designation" : "Create Designation"}
          </DialogTitle>
        </DialogHeader>
        {isEdit && isDetailLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Code</FieldLabel>
                <Input
                  placeholder="e.g. SR_MGR"
                  aria-invalid={!!errors.code}
                  {...register("code")}
                  disabled={isEdit}
                  autoComplete="off"
                />
                {isEdit && (
                  <p className="text-xs text-muted-foreground">
                    Code cannot be changed after creation.
                  </p>
                )}
                <FieldError errors={[errors.code]} />
              </Field>
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input
                  placeholder="e.g. Senior Manager"
                  aria-invalid={!!errors.name}
                  {...register("name")}
                  autoComplete="off"
                />
                <FieldError errors={[errors.name]} />
              </Field>
              <Field>
                <FieldLabel>Hierarchy Level</FieldLabel>
                <Input
                  type="number"
                  placeholder="e.g. 10"
                  aria-invalid={!!errors.hierarchyLevel}
                  {...register("hierarchyLevel", { valueAsNumber: true })}
                />
                <FieldError errors={[errors.hierarchyLevel]} />
              </Field>
              <Field>
                <FieldLabel>Description</FieldLabel>
                <Input
                  placeholder="Optional description"
                  {...register("description")}
                />
              </Field>
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
