"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/validations/auth"
import { useForgotPassword } from "@/features/auth/hooks/use-forgot-password"

export function ForgotPasswordForm() {
  const forgotPasswordMutation = useForgotPassword()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={handleSubmit((values) =>
        forgotPasswordMutation.mutate(values, {
          onSuccess: () => {
            toast.success("If an account exists, a reset link has been sent")
          },
          onError: () => {
            toast.error("Something went wrong, please try again")
          },
        })
      )}
    >
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-bold">Forgot your password?</h1>
        <p className="text-sm text-balance text-muted-foreground">
          Enter your email and we&apos;ll send you a link to reset your password
        </p>
      </div>

      <FieldGroup>
        {isSubmitSuccessful ? (
          <p className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
            If an account exists for that email, a password reset link is on
            its way.
          </p>
        ) : (
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            <FieldError errors={[errors.email]} />
          </Field>
        )}

        <Field>
          <Button
            type="submit"
            className="w-full"
            disabled={forgotPasswordMutation.isPending || isSubmitSuccessful}
          >
            {forgotPasswordMutation.isPending ? "Sending..." : "Send reset link"}
          </Button>
        </Field>

        <p className="text-center text-sm text-muted-foreground">
          <a
            href="/auth/login"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Back to login
          </a>
        </p>
      </FieldGroup>
    </form>
  )
}
