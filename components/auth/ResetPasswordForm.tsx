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
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@/lib/validations/auth"
import { useResetPassword } from "@/features/auth/hooks/use-reset-password"

export function ResetPasswordForm({ token }: { token: string }) {
  const resetPasswordMutation = useResetPassword()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  })

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={handleSubmit((values) =>
        resetPasswordMutation.mutate(
          { token, values },
          {
            onSuccess: () => {
              toast.success("Password reset successfully")
            },
            onError: () => {
              toast.error("This reset link is invalid or has expired")
            },
          }
        )
      )}
    >
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="text-sm text-balance text-muted-foreground">
          Enter a new password for your account
        </p>
      </div>

      <FieldGroup>
        {isSubmitSuccessful ? (
          <div className="flex flex-col gap-3 text-center">
            <p className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
              Your password has been reset. You can now sign in with your new
              password.
            </p>
            <Button className="w-full">
              <a href="/auth/login">Back to login</a>
            </Button>
          </div>
        ) : (
          <>
            <Field>
              <FieldLabel htmlFor="password">New password</FieldLabel>
              <PasswordInput
                id="password"
                placeholder="Enter a new password"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                showRequirements
                {...register("password")}
              />
              <FieldError errors={[errors.password]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
              <PasswordInput
                id="confirmPassword"
                placeholder="Confirm your password"
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
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending ? "Resetting..." : "Reset password"}
              </Button>
            </Field>
          </>
        )}
      </FieldGroup>
    </form>
  )
}
