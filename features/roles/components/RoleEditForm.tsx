"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  FormTextField,
  FormTextareaField,
  FormSelectField,
} from "@/components/common/form-fields"
import { Card, CardContent } from "@/components/ui/card"
import { useUpdateRole } from "../hooks/use-update-role"
import { getRoleErrorMessage } from "../utils/role.utils"
import { ROLE_STATUS_OPTIONS } from "../configs/role.constants"
import type { RoleDetail } from "../api/role.types"

const editSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
})

export type RoleEditValues = z.infer<typeof editSchema>

type RoleEditFormProps = {
  companyUuid: string
  roleUuid: string
  role: RoleDetail
  onSuccessPath: string
}

export function RoleEditForm({
  companyUuid,
  roleUuid,
  role,
  onSuccessPath,
}: RoleEditFormProps) {
  const router = useRouter()
  const updateMutation = useUpdateRole(companyUuid, roleUuid)

  const {
    control,
    handleSubmit,
    reset,
  } = useForm<RoleEditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: role.name,
      description: role.description ?? "",
      status: role.status,
    },
  })

  useEffect(() => {
    reset({
      name: role.name,
      description: role.description ?? "",
      status: role.status,
    })
  }, [role, reset])

  return (
    <form
      className="max-w-lg space-y-6"
      onSubmit={handleSubmit((values) =>
        updateMutation.mutate(values, {
          onSuccess: () => {
            toast.success("Role updated")
            router.push(onSuccessPath)
          },
          onError: (error) =>
            toast.error(getRoleErrorMessage(error, "Failed to update role")),
        })
      )}
    >
      <Card>
        <CardContent className="space-y-4 pt-6">
          <FieldGroup>
            <Field>
              <FieldLabel>Code</FieldLabel>
              <Input value={role.code} disabled className="font-mono" />
            </Field>
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
            <FormSelectField
              control={control}
              name="status"
              label="Status"
              placeholder="Select status"
              options={ROLE_STATUS_OPTIONS}
            />
          </FieldGroup>
        </CardContent>
      </Card>
      <div className="flex gap-2">
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
