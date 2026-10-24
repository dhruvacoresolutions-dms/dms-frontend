"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

import { serverNow } from "@/lib/server-clock"

export type User = {
  userUuid: string
  username: string
  displayName: string
  companyUuid: string | null
  companyCode: string | null
  roles: string[]
  /** Present for company users linked to an employee record. */
  employeeUuid?: string | null
}

export type SessionMode = "PLATFORM_STATELESS" | "TENANT_MANAGED"

export type AuthSession = {
  accessToken: string
  tokenType: string
  expiresIn: number
  /**
   * Server-authoritative expiry (epoch ms). Comes from the API response —
   * never computed from `expiresIn` on the client.
   */
  expiresAt: number
  /** Server-clock time when this token was issued or last renewed (epoch ms). */
  renewedAt: number
  /**
   * PLATFORM_STATELESS tokens cannot be renewed (renewal is ADMIN_WEB tenant
   * sessions only). Missing on legacy persisted sessions.
   */
  sessionMode?: SessionMode
  mustChangePassword: boolean
  user: User
}

/** Shape accepted by `setSession` — `expiresAt` may be raw ISO from the API. */
export type AuthSessionInput = Omit<AuthSession, "expiresAt" | "renewedAt"> & {
  expiresAt: number | string
  renewedAt?: number
}

export type SessionTokenUpdate = {
  accessToken: string
  expiresAt: number
  expiresIn?: number
  renewedAt?: number
  mustChangePassword?: boolean
}

type AuthState = {
  session: AuthSession | null
  setSession: (session: AuthSessionInput) => void
  updateSessionToken: (update: SessionTokenUpdate) => void
  updateUser: (user: Partial<User>) => void
  setMustChangePassword: (value: boolean) => void
  clearSession: () => void
}

function normalizeSession(session: AuthSessionInput | null): AuthSession | null {
  if (!session) {
    return null
  }

  const parsedExpiry =
    typeof session.expiresAt === "string"
      ? Date.parse(session.expiresAt)
      : session.expiresAt

  const expiresAt = Number.isFinite(parsedExpiry) ? parsedExpiry : serverNow()
  // Legacy persisted sessions have no renewedAt; derive it from the token
  // lifetime so the renewal throttle stays accurate after a reload.
  const renewedAt =
    typeof session.renewedAt === "number"
      ? session.renewedAt
      : expiresAt - (session.expiresIn ?? 0) * 1000

  return { ...session, expiresAt, renewedAt }
}

export function isSessionExpired(session: AuthSession | null): boolean {
  if (!session) {
    return true
  }

  return serverNow() >= session.expiresAt
}

/**
 * Only tenant ADMIN_WEB sessions slide. Platform tokens are stateless and
 * `/auth/session/activity` rejects them.
 */
export function isRenewableSession(session: AuthSession | null): boolean {
  if (!session) {
    return false
  }

  if (session.sessionMode === "PLATFORM_STATELESS") {
    return false
  }

  if (session.sessionMode === "TENANT_MANAGED") {
    return true
  }

  // Legacy persisted sessions have no mode: company sessions have a company.
  return !!session.user.companyUuid
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session: normalizeSession(session) }),
      updateSessionToken: (update) =>
        set((state) => {
          if (!state.session) {
            return state
          }

          return {
            session: {
              ...state.session,
              accessToken: update.accessToken,
              expiresAt: update.expiresAt,
              expiresIn: update.expiresIn ?? state.session.expiresIn,
              renewedAt: update.renewedAt ?? serverNow(),
              mustChangePassword:
                update.mustChangePassword ?? state.session.mustChangePassword,
            },
          }
        }),
      updateUser: (patch) =>
        set((state) =>
          state.session
            ? {
                session: {
                  ...state.session,
                  user: { ...state.session.user, ...patch },
                },
              }
            : state
        ),
      setMustChangePassword: (value) =>
        set((state) =>
          state.session
            ? {
                session: { ...state.session, mustChangePassword: value },
              }
            : state
        ),
      clearSession: () => set({ session: null }),
    }),
    {
      name: "dms-auth",
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<AuthState> | undefined

        return {
          ...current,
          ...persistedState,
          session: normalizeSession(
            (persistedState?.session as AuthSessionInput | null) ?? null
          ),
        }
      },
    }
  )
)
