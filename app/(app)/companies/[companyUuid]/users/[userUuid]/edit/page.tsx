"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { PageHeader } from "@/components/common/PageHeader"
import { LoadingState } from "@/components/common/LoadingState"
import { useUser } from "@/features/users/hooks/use-user"
import { useUpdateUser } from "@/features/users/hooks/use-update-user"
import { getApiErrorMessage } from "@/lib/api/api-error"

const editUserSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  email: z.string().email("Enter a valid email address"),
})

type EditUserValues = z.infer<typeof editUserSchema>

export default function EditUserPage() {
  const params = useParams<{ companyUuid: string; userUuid: string }>()
  const router = useRouter()
  const companyUuid = params.companyUuid
  const userUuid = params.userUuid

  const { data: user, isLoading } = useUser(companyUuid, userUuid)
  const updateUserMutation = useUpdateUser(companyUuid, userUuid)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditUserValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      displayName: "",
      email: "",
    },
  })

  useEffect(() => {
    if (user) {
      reset({
        displayName: user.displayName,
        email: user.email ?? "",
      })
    }
  }, [user, reset])

  if (isLoading) return <LoadingState />

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader title="Edit User" description={`Editing ${user?.username}`} />

      <form
        className="max-w-lg space-y-6"
        onSubmit={handleSubmit((values) =>
          updateUserMutation.mutate(values, {
            onSuccess: () => {
              toast.success("User updated successfully")
              router.push(`/companies/${companyUuid}/users/${userUuid}`)
            },
            onError: (error) => {
              toast.error(
                getApiErrorMessage(error, "Failed to update user")
              )
            },
          })
        )}
      >
        <div className="rounded-lg border p-6 space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="displayName">Display Name</FieldLabel>
              <Input
                id="displayName"
                aria-invalid={!!errors.displayName}
                {...register("displayName")}
              />
              <FieldError errors={[errors.displayName]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              <FieldError errors={[errors.email]} />
            </Field>
          </FieldGroup>
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={updateUserMutation.isPending}>
            {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
