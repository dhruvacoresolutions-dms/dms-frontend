"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

import { useAuthStore } from "@/stores/auth-store"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      return
    }

    const redirect = encodeURIComponent(pathname)
    router.replace(`/auth/login?redirect=${redirect}`)
  }, [user, pathname, router])

  if (!user) {
    return null
  }

  return <>{children}</>
}