"use client"

import { useMutation } from "@tanstack/react-query"

import { resetPassword } from "../api/auth.api"

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ token, values }: { token: string; values: Parameters<typeof resetPassword>[1] }) =>
      resetPassword(token, values),
  })
}
