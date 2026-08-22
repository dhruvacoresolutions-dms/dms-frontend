"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { useAccessStore } from "@/stores/access-store"
import { useCurrentUser } from "@/features/auth/hooks/use-current-user"
import { useCurrentAccess } from "@/features/auth/hooks/use-current-access"

export function AppBootstrap({ children }: { children: React.ReactNode }) {
  const setAccess = useAccessStore((state) => state.setAccess)
  const session = useAuthStore((state) => state.session)

  useCurrentUser()
  const currentAccessQuery = useCurrentAccess()

  useEffect(() => {
    if (currentAccessQuery.data) {
      setAccess(currentAccessQuery.data)
    }
  }, [currentAccessQuery.data, setAccess])

  return <>{children}</>
}
