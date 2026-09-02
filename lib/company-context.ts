"use client"

import { useAuthStore } from "@/stores/auth-store"

export function resolveCompanyUuid(companyUuid: string): string {
  if (companyUuid !== "current") return companyUuid
  const sessionCompany = useAuthStore.getState().session?.user?.companyUuid
  if (sessionCompany) return sessionCompany
  return companyUuid
}

export function useResolvedCompanyUuid(companyUuid: string): string {
  const sessionCompany = useAuthStore((s) => s.session?.user?.companyUuid)
  if (companyUuid === "current" && sessionCompany) return sessionCompany
  return companyUuid
}
