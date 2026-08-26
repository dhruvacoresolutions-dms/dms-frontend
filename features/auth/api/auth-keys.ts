export const authKeys = {
  all: ["auth"] as const,
  session: () => [...authKeys.all, "session"] as const,
  me: () => [...authKeys.all, "me"] as const,
  access: (companyUuid?: string | null) =>
    [...authKeys.all, "access", companyUuid ?? "platform"] as const,
} as const
