"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FieldGroup } from "@/components/ui/field"
import {
  FormTextField,
  FormTextareaField,
} from "@/components/common/form-fields"
import { useCreatePermissionSet } from "../hooks/use-create-permission-set"
import { getPermissionSetErrorMessage } from "../utils/permission-set.utils"
import {
  PERMISSION_SET_CODE_MAX_LENGTH,
  PERMISSION_SET_CODE_MIN_LENGTH,
  PERMISSION_SET_CODE_PATTERN,
} from "../configs/permission-set.constants"

const permissionSetSchema = z.object({
  code: z
    .string()
    .min(
      PERMISSION_SET_CODE_MIN_LENGTH,
      `Code must be at least ${PERMISSION_SET_CODE_MIN_LENGTH} characters`
    )
    .max(
      PERMISSION_SET_CODE_MAX_LENGTH,
      `Code must be at most ${PERMISSION_SET_CODE_MAX_LENGTH} characters`
    )
    .regex(
      PERMISSION_SET_CODE_PATTERN,
      "Must be uppercase letters, numbers, or underscores"
    ),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
})

export type PermissionSetCreateValues = z.infer<typeof permissionSetSchema>

type PermissionSetCreateDialogProps = {
  companyUuid: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PermissionSetCreateDialog({
  companyUuid,
  open,
  onOpenChange,
}: PermissionSetCreateDialogProps) {
  const createMutation = useCreatePermissionSet(companyUuid)
  const {
    control,
    handleSubmit,
    reset,
  } = useForm<PermissionSetCreateValues>({
    resolver: zodResolver(permissionSetSchema),
    defaultValues: { code: "", name: "", description: "" },
  })

  const onSubmit = (values: PermissionSetCreateValues) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        toast.success("Permission set created")
        reset()
        onOpenChange(false)
      },
      onError: (error) =>
        toast.error(
          getPermissionSetErrorMessage(error, "Failed to create permission set")
        ),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 size-4" /> Create Permission Set
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Permission Set</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <FormTextField
              control={control}
              name="code"
              label="Code"
              placeholder="Enter code"
            />
            <FormTextField
              control={control}
              name="name"
              label="Name"
              placeholder="Enter name"
            />
            <FormTextareaField
              control={control}
              name="description"
              label="Description"
              placeholder="Enter description"
            />
          </FieldGroup>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
