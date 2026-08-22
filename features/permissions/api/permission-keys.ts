export const permissionKeys = {
  all: ["permissions"] as const,
  lists: () => [...permissionKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) =>
    [...permissionKeys.lists(), params] as const,
  matrix: () => [...permissionKeys.all, "matrix"] as const,
} as const
