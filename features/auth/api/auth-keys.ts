export const authKeys = {
  all: ["auth"] as const,
  session: () => [...authKeys.all, "session"] as const,
  me: () => [...authKeys.all, "me"] as const,
  access: () => [...authKeys.all, "access"] as const,
} as const
