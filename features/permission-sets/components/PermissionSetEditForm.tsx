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
import { Card, CardContent } from "@/components/ui/card"
import { useUpdatePermissionSet } from "../hooks/use-update-permission-set"
import { getPermissionSetErrorMessage } from "../utils/permission-set.utils"
import {
  PERMISSION_SET_CODE_MAX_LENGTH,
  PERMISSION_SET_CODE_MIN_LENGTH,
  PERMISSION_SET_CODE_PATTERN,
} from "../configs/permission-set.constants"
import type { PermissionSetDetail } from "../api/permission-set.types"

const editSchema = z.object({
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

export type PermissionSetEditValues = z.infer<typeof editSchema>

type PermissionSetEditFormProps = {
  companyUuid: string
  setUuid: string
  set: PermissionSetDetail
  onSuccessPath: string
}

export function PermissionSetEditForm({
  companyUuid,
  setUuid,
  set,
  onSuccessPath,
}: PermissionSetEditFormProps) {
  const router = useRouter()
  const updateMutation = useUpdatePermissionSet(companyUuid, setUuid)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PermissionSetEditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      code: set.code,
      name: set.name,
      description: set.description ?? "",
    },
  })

  useEffect(() => {
    reset({
      code: set.code,
      name: set.name,
      description: set.description ?? "",
    })
  }, [set, reset])

  return (
    <form
      className="max-w-lg space-y-6"
      onSubmit={handleSubmit((values) =>
        updateMutation.mutate(values, {
          onSuccess: () => {
            toast.success("Permission set updated")
            router.push(onSuccessPath)
          },
          onError: (error) =>
            toast.error(
              getPermissionSetErrorMessage(error, "Failed to update permission set")
            ),
        })
      )}
    >
      <Card>
        <CardContent className="space-y-4 pt-6">
          <FieldGroup>
            <Field>
              <FieldLabel>Code</FieldLabel>
              <Input
                aria-invalid={!!errors.code}
                className="font-mono"
                {...register("code")}
              />
              <FieldError errors={[errors.code]} />
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
