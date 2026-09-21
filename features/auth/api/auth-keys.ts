export const authKeys = {
  all: ["auth"] as const,
  session: () => [...authKeys.all, "session"] as const,
  me: () => [...authKeys.all, "me"] as const,
  access: (companyUuid?: string | null, userUuid?: string | null) =>
    [...authKeys.all, "access", companyUuid ?? "platform", userUuid ?? "self"] as const,
} as const
