"use client"

import { useRouter } from "next/navigation"
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
import { PasswordInput } from "@/components/auth/PasswordInput"
import { loginSchema, type LoginValues } from "@/lib/validations/auth"
import { useLogin } from "@/features/auth/hooks/use-login"
import { useAuthStore } from "@/stores/auth-store"
import { setSessionCookie } from "@/lib/session"
import { getApiError, getApiErrorMessage } from "@/lib/api/api-error"

export function LoginForm({ redirect }: { redirect?: string }) {
  const router = useRouter()
  const setSession = useAuthStore((state) => state.setSession)
  const loginMutation = useLogin()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  })

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={handleSubmit((values) =>
        loginMutation.mutate(values, {
          onSuccess: (session) => {
            setSession(session)
            setSessionCookie(session.accessToken, session.expiresIn)

            if (session.mustChangePassword) {
              toast.info("You must change your password before continuing")
              router.push("/auth/change-password")
              return
            }

            toast.success("Logged in successfully")
            router.push(redirect ?? "/dashboard")
          },
          onError: (error) => {
            const apiError = getApiError(error)

            if (apiError?.errors?.length) {
              for (const fieldError of apiError.errors) {
                if (
                  fieldError.field === "username" ||
                  fieldError.field === "password"
                ) {
                  setError(fieldError.field, {
                    type: "server",
                    message: fieldError.message,
                  })
                }
              }
              return
            }

            toast.error(
              getApiErrorMessage(error, "Login failed. Please try again.")
            )
          },
        })
      )}
    >
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold">Login to your account</h1>
        <p className="text-sm text-balance text-muted-foreground">
          Enter your username below to login to your account
        </p>
      </div>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="username">Username</FieldLabel>
          <Input
            id="username"
            type="text"
            placeholder="Enter your username"
            autoComplete="username"
            autoFocus
            aria-invalid={!!errors.username}
            {...register("username")}
          />
          <FieldError errors={[errors.username]} />
        </Field>

        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <a
              href="/auth/forgot-password"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          <PasswordInput
            id="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>

        <Field>
          <Button
            type="submit"
            className="w-full"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Logging in..." : "Login"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
