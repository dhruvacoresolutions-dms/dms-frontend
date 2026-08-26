"use client"

import { QueryClientProvider } from "@tanstack/react-query"
import { useEffect, useState } from "react"

import { createQueryClient } from "@/lib/react-query/query-client"
import { setGlobalQueryClient } from "@/lib/unauthorized-handler"

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => createQueryClient())

  useEffect(() => {
    setGlobalQueryClient(client)
  }, [client])

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
