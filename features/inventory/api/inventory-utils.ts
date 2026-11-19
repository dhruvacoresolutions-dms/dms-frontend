import { useAuthStore } from "@/stores/auth-store"

export function resolveCompanyUuid(companyUuid: string): string {
  if (companyUuid !== "current") return companyUuid
  return useAuthStore.getState().session?.user?.companyUuid ?? companyUuid
}

export function companyHeaders(companyUuid: string): Record<string, string> {
  return { "X-Company-Context": resolveCompanyUuid(companyUuid) }
}

export function companyBase(companyUuid: string): string {
  return `/api/v1/companies/${resolveCompanyUuid(companyUuid)}`
}

export function distributorBase(
  companyUuid: string,
  distributorUuid: string
): string {
  return `${companyBase(companyUuid)}/distributors/${distributorUuid}`
}
