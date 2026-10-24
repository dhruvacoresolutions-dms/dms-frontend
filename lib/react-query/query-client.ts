import { QueryClient } from "@tanstack/react-query"

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: (failureCount, error) => {
          const status = (error as { response?: { status?: number } })?.response
            ?.status

          // 401/403 are decided by the session layer; retrying only creates
          // duplicate logout/probe traffic.
          if (status === 401 || status === 403) {
            return false
          }

          return failureCount < 1
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}
