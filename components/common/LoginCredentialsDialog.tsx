"use client"

import * as React from "react"
import { Check, CheckCircle2, Copy } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type LoginCredentials = {
  username: string
  temporaryPassword?: string | null
  mustChangePassword?: boolean
  emailDispatched?: boolean
}

type Props = {
  /** Null hides the dialog */
  data: LoginCredentials | null
  title: string
  description?: React.ReactNode
  footer?: React.ReactNode
  onClose: () => void
}

/**
 * One-time view of generated login credentials (single account).
 * Same look as the company-create admin credentials modal: username and
 * temporary-password rows with per-field copy buttons.
 */
export function LoginCredentialsDialog({
  data,
  title,
  description,
  footer,
  onClose,
}: Props) {
  const [copiedField, setCopiedField] = React.useState<
    "username" | "password" | null
  >(null)

  const handleClose = () => {
    setCopiedField(null)
    onClose()
  }

  const handleCopy = async (
    value: string,
    field: "username" | "password"
  ) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(field)
      toast.success(
        `${field === "username" ? "Username" : "Password"} copied to clipboard`
      )
      setTimeout(
        () => setCopiedField((f) => (f === field ? null : f)),
        2000
      )
    } catch {
      toast.error("Failed to copy")
    }
  }

  return (
    <Dialog open={!!data} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-6 text-green-600" />
            <DialogTitle>{title}</DialogTitle>
          </div>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        {data && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 shadow-xs">
                <span className="flex-1 font-mono text-sm break-all">
                  {data.username}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleCopy(data.username, "username")}
                  aria-label="Copy username"
                >
                  {copiedField === "username" ? (
                    <Check className="size-4 text-green-600" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
            </div>

            {data.temporaryPassword && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Temporary Password
                </label>
                <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 shadow-xs">
                  <span className="flex-1 font-mono text-sm break-all">
                    {data.temporaryPassword}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      handleCopy(data.temporaryPassword as string, "password")
                    }
                    aria-label="Copy password"
                  >
                    {copiedField === "password" ? (
                      <Check className="size-4 text-green-600" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                </div>
                {data.mustChangePassword && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Password must be changed on first login.
                  </p>
                )}
              </div>
            )}

            {data.emailDispatched && (
              <p className="text-xs text-muted-foreground">
                Login details have also been emailed.
              </p>
            )}
          </div>
        )}

        <DialogFooter>{footer ?? <Button onClick={handleClose}>Done</Button>}</DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
