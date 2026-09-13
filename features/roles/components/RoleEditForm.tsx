"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { useUpdateRole } from "../hooks/use-update-role"
import { getRoleErrorMessage } from "../utils/role.utils"
import { ROLE_STATUS_OPTIONS } from "../configs/role.constants"
import type { RoleDetail, RoleStatus } from "../api/role.types"

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
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
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

  const status = watch("status")

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
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input aria-invalid={!!errors.name} {...register("name")} />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field>
              <FieldLabel>Description</FieldLabel>
              <Textarea {...register("description")} />
            </Field>
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select
                value={status}
                onValueChange={(v) => {
                  if (v === "ACTIVE" || v === "INACTIVE") {
                    setValue("status", v as RoleStatus, {
                      shouldDirty: true,
                    })
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[errors.status]} />
            </Field>
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
