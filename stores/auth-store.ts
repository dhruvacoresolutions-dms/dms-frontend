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
  expiresAt: number // epoch ms, computed from expiresIn on setSession
  mustChangePassword: boolean
  user: User
}

type AuthState = {
  session: AuthSession | null
  setSession: (session: Omit<AuthSession, "expiresAt"> & { expiresAt?: number }) => void
  updateUser: (user: Partial<User>) => void
  clearSession: () => void
}

function computeExpiresAt(session: Omit<AuthSession, "expiresAt"> & { expiresAt?: number }): number {
  // If BE already sends expiresAt use it, otherwise compute from expiresIn
  if (session.expiresAt && session.expiresAt > Date.now()) return session.expiresAt
  return Date.now() + session.expiresIn * 1000
}

export function isSessionExpired(session: AuthSession | null): boolean {
  if (!session) return true
  return Date.now() >= session.expiresAt
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => {
        // Normalize: ensure expiresAt is always set even for old persisted sessions
        const normalized: AuthSession =
          "expiresAt" in session && typeof (session as AuthSession).expiresAt === "number"
            ? (session as AuthSession)
            : { ...session, expiresAt: computeExpiresAt(session as Omit<AuthSession, "expiresAt">) }
        set({ session: normalized })
      },
      updateUser: (patch) =>
        set((state) =>
          state.session
            ? { session: { ...state.session, user: { ...state.session.user, ...patch } } }
            : state
        ),
      clearSession: () => set({ session: null }),
    }),
    { name: "dms-auth" }
  )
)