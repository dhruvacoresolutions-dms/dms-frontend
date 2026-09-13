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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { useCreateRole } from "../hooks/use-create-role"
import { getRoleErrorMessage } from "../utils/role.utils"
import {
  ROLE_CODE_MAX_LENGTH,
  ROLE_CODE_MIN_LENGTH,
  ROLE_CODE_PATTERN,
} from "../configs/role.constants"

const roleSchema = z.object({
  code: z
    .string()
    .min(ROLE_CODE_MIN_LENGTH, `Code must be at least ${ROLE_CODE_MIN_LENGTH} characters`)
    .max(ROLE_CODE_MAX_LENGTH, `Code must be at most ${ROLE_CODE_MAX_LENGTH} characters`)
    .regex(ROLE_CODE_PATTERN, "Must be uppercase letters, numbers, or underscores"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
})

export type RoleCreateValues = z.infer<typeof roleSchema>

type RoleCreateDialogProps = {
  companyUuid: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RoleCreateDialog({
  companyUuid,
  open,
  onOpenChange,
}: RoleCreateDialogProps) {
  const createMutation = useCreateRole(companyUuid)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoleCreateValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: { code: "", name: "", description: "" },
  })

  const onSubmit = (values: RoleCreateValues) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        toast.success("Role created")
        reset()
        onOpenChange(false)
      },
      onError: (error) =>
        toast.error(getRoleErrorMessage(error, "Failed to create role")),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 size-4" /> Create Role
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Role</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel>Code</FieldLabel>
              <Input
                placeholder="e.g. SFA_USER"
                aria-invalid={!!errors.code}
                {...register("code")}
              />
              <FieldError errors={[errors.code]} />
            </Field>
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input
                placeholder="e.g. SFA User"
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field>
              <FieldLabel>Description</FieldLabel>
              <Textarea
                placeholder="Standard field sales role (optional)"
                {...register("description")}
              />
            </Field>
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
