"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type User = {
  userUuid: string
  username: string
  displayName: string
  companyUuid: string | null
  companyCode: string | null
  roles: string[]
}

export type AuthSession = {
  accessToken: string
  tokenType: string
  expiresIn: number
  mustChangePassword: boolean
  user: User
}

type AuthState = {
  session: AuthSession | null
  setSession: (session: AuthSession) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),
    }),
    { name: "dms-auth" }
  )
)