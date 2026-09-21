import { ShieldAlert } from "lucide-react"

import { EmptyState } from "@/components/common/EmptyState"

/**
 * Reusable 403 UI, built on the existing `EmptyState` primitive so it matches
 * the in-app "Access denied" pattern (see permissions pages).
 *
 * Rendered by `RouteGate` for unauthorized pages and usable anywhere a
 * forbidden state is needed. Frontend gates are UX-only — the backend
 * remains the authorization authority.
 */
export function ForbiddenState({
  title = "Access denied",
  description = "You don't have permission to access this page. Contact your administrator if you believe you should have access.",
  children,
}: {
  title?: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <EmptyState title={title} description={description} icon={ShieldAlert}>
      {children}
    </EmptyState>
  )
}
