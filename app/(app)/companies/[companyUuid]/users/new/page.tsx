"use client"

import { useParams, useRouter } from "next/navigation"
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
import { PasswordInput } from "@/components/auth/PasswordInput"
import { PageHeader } from "@/components/common/PageHeader"
import { useCreateUser } from "@/features/users/hooks/use-create-user"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { passwordSchema } from "@/lib/validations/password"

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
  password: passwordSchema,
})

type UserFormValues = z.infer<typeof userSchema>

export default function NewUserPage() {
  const params = useParams<{ companyUuid: string }>()
  const router = useRouter()
  const companyUuid = params.companyUuid
  const createUserMutation = useCreateUser(companyUuid)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      displayName: "",
      email: "",
      password: "",
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
              router.push(`/companies/${companyUuid}/users`)
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
            <Field>
              <FieldLabel htmlFor="username">Username</FieldLabel>
              <Input
                id="username"
                placeholder="e.g. john.doe"
                aria-invalid={!!errors.username}
                {...register("username")}
              />
              <FieldError errors={[errors.username]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="displayName">Display Name</FieldLabel>
              <Input
                id="displayName"
                placeholder="e.g. John Doe"
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
                placeholder="e.g. john@company.com"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              <FieldError errors={[errors.email]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <PasswordInput
                id="password"
                placeholder="Minimum 12 characters"
                aria-invalid={!!errors.password}
                showRequirements
                {...register("password")}
              />
              <FieldError errors={[errors.password]} />
            </Field>
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
