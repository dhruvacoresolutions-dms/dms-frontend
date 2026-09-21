"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
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
import { AuthLoadingScreen } from "@/components/auth/AuthLoadingScreen"
import { loginSchema, type LoginValues } from "@/lib/validations/auth"
import { useLogin } from "@/features/auth/hooks/use-login"
import { getCurrentAccess } from "@/features/auth/api/auth.api"
import { authKeys } from "@/features/auth/api/auth-keys"
import { useAuthStore } from "@/stores/auth-store"
import { useAccessStore } from "@/stores/access-store"
import { setSessionCookie } from "@/lib/session"
import { getApiError, getApiErrorMessage } from "@/lib/api/api-error"

export function LoginForm() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const setSession = useAuthStore((state) => state.setSession)
  const setAccess = useAccessStore((state) => state.setAccess)
  const loginMutation = useLogin()
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  })

  const isBusy = loginMutation.isPending || isLoadingPermissions

  return (
    <>
      {isLoadingPermissions && <AuthLoadingScreen variant="login" />}
      <form
        className="flex flex-col gap-7"
        onSubmit={handleSubmit((values) =>
          loginMutation.mutate(values, {
            onSuccess: async (session) => {
              setSession(session)
              setSessionCookie(session.accessToken, session.expiresIn)

              if (session.mustChangePassword) {
                toast.info("You must change your password before continuing")
                router.push("/auth/change-password")
                return
              }

              // Fetch permissions right after session is set, before
              // entering the app, so route access can be enforced from the
              // user's effective permissions. The full-screen loader stays
              // up until navigation unmounts this page, so only the loader
              // is visible between login success and the dashboard.
              setIsLoadingPermissions(true)
              try {
                // Drop any previous user's cached access before fetching.
                await queryClient.cancelQueries({ queryKey: authKeys.all })
                queryClient.removeQueries({ queryKey: authKeys.all })

                const access = await getCurrentAccess()
                setAccess(access)
                queryClient.setQueryData(
                  authKeys.access(
                    session.user?.companyUuid,
                    session.user?.userUuid
                  ),
                  access
                )
              } catch {
                // Don't lock the user out if the access call fails —
                // AppBootstrap retries it behind a loading screen.
                toast.error(
                  "Could not load your permissions. Some features may be unavailable."
                )
              }

              toast.success("Logged in successfully")
              // Fresh login every time: always start at the dashboard.
              // isLoadingPermissions is intentionally left true — the
              // loading screen covers the transition until this page unmounts.
              router.push("/dashboard")
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
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <h6 className="text-[15px] text-balance text-muted-foreground">
            Enter your credentials to access your account
          </h6>
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
              className="h-[52px] text-[15px]"
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
              className="h-[52px] w-full text-[15px] font-medium"
              disabled={isBusy}
            >
              {loginMutation.isPending
                ? "Logging in..."
                : isLoadingPermissions
                  ? "Loading permissions..."
                  : "Login"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </>
  )
}
