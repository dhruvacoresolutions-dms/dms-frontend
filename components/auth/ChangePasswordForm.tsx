"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { PasswordInput } from "@/components/auth/PasswordInput"
import {
  changePasswordSchema,
  type ChangePasswordValues,
} from "@/lib/validations/auth"
import { useChangePassword } from "@/features/auth/hooks/use-change-password"
import { useLogout } from "@/features/auth/hooks/use-logout"
import { getApiError, getApiErrorMessage } from "@/lib/api/api-error"

const PASSWORD_FIELDS = ["currentPassword", "newPassword", "confirmPassword"] as const

export function ChangePasswordForm() {
  const { logout } = useLogout()
  const changePasswordMutation = useChangePassword()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={handleSubmit((values) =>
        changePasswordMutation.mutate(values, {
          onSuccess: () => {
            toast.success("Password changed successfully. Please log in again.")
            logout()
          },
          onError: (error) => {
            const apiError = getApiError(error)

            if (apiError?.errors?.length) {
              for (const fieldError of apiError.errors) {
                if (
                  (PASSWORD_FIELDS as readonly string[]).includes(fieldError.field)
                ) {
                  setError(fieldError.field as keyof ChangePasswordValues, {
                    type: "server",
                    message: fieldError.message,
                  })
                }
              }
              return
            }

            toast.error(
              getApiErrorMessage(error, "Failed to change password. Please try again.")
            )
          },
        })
      )}
    >
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-bold">Change your password</h1>
        <p className="text-sm text-balance text-muted-foreground">
          Choose a new password for your account
        </p>
      </div>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="currentPassword">Current password</FieldLabel>
          <PasswordInput
            id="currentPassword"
            placeholder="Enter your current password"
            autoComplete="current-password"
            aria-invalid={!!errors.currentPassword}
            {...register("currentPassword")}
          />
          <FieldError errors={[errors.currentPassword]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="newPassword">New password</FieldLabel>
          <PasswordInput
            id="newPassword"
            placeholder="Enter a new password"
            autoComplete="new-password"
            aria-invalid={!!errors.newPassword}
            showRequirements
            {...register("newPassword")}
          />
          <FieldError errors={[errors.newPassword]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
          <PasswordInput
            id="confirmPassword"
            placeholder="Confirm your new password"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
          <FieldError errors={[errors.confirmPassword]} />
        </Field>

        <Field>
          <Button
            type="submit"
            className="w-full"
            disabled={changePasswordMutation.isPending}
          >
            {changePasswordMutation.isPending ? "Changing..." : "Change password"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
