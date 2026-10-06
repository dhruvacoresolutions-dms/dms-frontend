"use client"

import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { FieldGroup } from "@/components/ui/field"
import { FormTextField } from "@/components/common/form-fields"
import { PageHeader } from "@/components/common/PageHeader"
import { RouteGate } from "@/components/auth/RouteGate"
import { PERMISSIONS } from "@/lib/permissions"
import { useCreateUser } from "@/features/users/hooks/use-create-user"
import { getApiErrorMessage } from "@/lib/api/api-error"

const userSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(100, "Username must not exceed 100 characters")
    .regex(
      /^[A-Za-z0-9._-]+$/,
      "Username must contain only letters, numbers, dots, hyphens, or underscores"
    ),
  displayName: z.string().min(1, "Display name is required"),
  email: z.string().email("Enter a valid email address"),
})

type UserFormValues = z.infer<typeof userSchema>

export default function NewUserPage() {
  return (
    <RouteGate permission={PERMISSIONS.USER.CREATE}>
      <NewUserContent />
    </RouteGate>
  )
}

function NewUserContent() {
  const router = useRouter()
  const companyUuid = useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const createUserMutation = useCreateUser(companyUuid)

  const {
    control,
    handleSubmit,
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      displayName: "",
      email: "",
    },
  })

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader title="Create User" description="Add a new user to this company" />

      <form
        className="max-w-lg space-y-6"
        onSubmit={handleSubmit((values) =>
          createUserMutation.mutate(values, {
            onSuccess: () => {
              toast.success("User created successfully")
              router.push(`/users`)
            },
            onError: (error) => {
              toast.error(
                getApiErrorMessage(error, "Failed to create user")
              )
            },
          })
        )}
      >
        <div className="rounded-lg border p-6 space-y-4">
          <FieldGroup>
            <FormTextField
              control={control}
              name="username"
              label="Username"
              placeholder="Enter username"
            />
            <FormTextField
              control={control}
              name="displayName"
              label="Display Name"
              placeholder="Enter display name"
            />
            <FormTextField
              control={control}
              name="email"
              label="Email"
              type="email"
              placeholder="Enter email"
            />
          </FieldGroup>
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={createUserMutation.isPending}>
            {createUserMutation.isPending ? "Creating..." : "Create User"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
