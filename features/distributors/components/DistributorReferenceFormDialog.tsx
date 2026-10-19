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
  requiredLabel,
} from "@/components/common/form-fields"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { applyApiFieldErrors } from "@/lib/api/form-errors"
import {
  optionalText,
  requiredCode,
  requiredName,
} from "@/lib/validations/master-data"
import { useCreateDistributorReference } from "../hooks/use-create-distributor-reference"
import { useUpdateDistributorReference } from "../hooks/use-update-distributor-reference"
import type {
  DistributorReferenceKind,
  DistributorReferenceResponse,
} from "../api/distributor-reference.types"

/**
 * Mirrors `CreateReferenceRequest` / `UpdateReferenceRequest`:
 *  - code @NotBlank @Size(max=30) @SafeCode (create only, immutable after)
 *  - name @NotBlank @Size(max=120) @SafeName
 *  - description @Size(max=500)
 *  - requiresParent is rejected unless the kind is DISTRIBUTOR_TYPE, so the
 *    switch is only rendered (and only sent) for distributor types
 *    (`DistributorReferenceService.type`).
 */
const referenceSchema = z.object({
  code: requiredCode("Code", 30),
  name: requiredName("Name", 120),
  description: optionalText("Description", 500),
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
  const supportsParent = kind === "distributor-types"
  const createMutation = useCreateDistributorReference(companyUuid, kind)
  const updateMutation = useUpdateDistributorReference(companyUuid, kind)

  const { handleSubmit, control, reset, setError } =
    useForm<ReferenceFormValues>({
      resolver: zodResolver(referenceSchema),
      defaultValues: {
        code: "",
        name: "",
        description: "",
        requiresParent: false,
      },
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
    // Omitted (undefined) rather than `false` for non-distributor types: the
    // backend rejects a non-null `requiresParent` for every other kind.
    const requiresParent = supportsParent ? values.requiresParent : undefined

    if (isEdit && reference) {
      updateMutation.mutate(
        {
          uuid: reference.uuid,
          input: {
            name: values.name.trim(),
            description: values.description?.trim() || undefined,
            requiresParent,
            version: reference.version,
          },
        },
        {
          onSuccess: () => {
            toast.success(`${singular} updated`)
            handleOpenChange(false)
          },
          onError: (error) => {
            applyApiFieldErrors(error, setError)
            toast.error(getApiErrorMessage(error, "Failed"))
          },
        }
      )
      return
    }

    createMutation.mutate(
      {
        code: values.code.trim().toUpperCase(),
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        requiresParent,
      },
      {
        onSuccess: () => {
          toast.success(`${singular} created`)
          reset()
          handleOpenChange(false)
        },
        onError: (error) => {
          applyApiFieldErrors(error, setError)
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
            {isEdit ? `Edit ${singular}` : `Create ${singular}`}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <FieldGroup>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <FormTextField
                control={control}
                name="code"
                label={requiredLabel("Code", !isEdit)}
                disabled={isEdit}
                maxLength={30}
              />
              <FormTextField
                control={control}
                name="name"
                label={requiredLabel("Name")}
                maxLength={120}
              />
              <FormTextareaField
                control={control}
                name="description"
                label="Description"
                className="lg:col-span-2"
              />
              {supportsParent && (
                <FormSwitchField
                  control={control}
                  name="requiresParent"
                  label="Requires Parent"
                  className="lg:col-span-2"
                />
              )}
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
