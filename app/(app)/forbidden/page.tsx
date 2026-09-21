"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { ForbiddenState } from "@/components/common/ForbiddenState"

/**
 * Routable 403 page (target for `RouteGate redirectTo="/forbidden"` flows).
 * Lives inside the `(app)` shell so it requires login via `proxy.ts`.
 */
export default function ForbiddenPage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <ForbiddenState>
        <Button variant="outline" className="mt-2">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </ForbiddenState>
    </div>
  )
}
