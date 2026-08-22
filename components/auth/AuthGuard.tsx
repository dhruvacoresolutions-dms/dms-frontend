"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

import { useAuthStore } from "@/stores/auth-store"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const session = useAuthStore((state) => state.session)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      return
    }

    const redirect = encodeURIComponent(pathname)
    router.replace(`/auth/login?redirect=${redirect}`)
  }, [session, pathname, router])

  if (!session) {
    return null
  }

  return <>{children}</>
}