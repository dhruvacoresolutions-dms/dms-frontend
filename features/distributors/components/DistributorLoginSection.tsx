"use client"

import { useState } from "react"
import { format } from "date-fns"
import {
  Check,
  Copy,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  UserPlus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { StatusBadge } from "@/components/common/StatusBadge"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { PERMISSIONS } from "@/lib/permissions"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { toast } from "sonner"
import { useDistributorLoginStatus } from "../hooks/use-distributor-login-status"
import { useCreateDistributorLogin } from "../hooks/use-create-distributor-login"
import { useChangeDistributorLoginStatus } from "../hooks/use-change-distributor-login-status"
import { useResetDistributorLoginPassword } from "../hooks/use-reset-distributor-login-password"
import type { DistributorLoginCredentialsResponse } from "../api/distributor.types"

type Props = {
  companyUuid: string
  distributorUuid: string
  distributorActive: boolean
}

type PendingAction = "disable" | "enable" | "reset" | null

function formatDateTime(iso?: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return format(d, "dd MMM yyyy, hh:mm a")
}

export function DistributorLoginSection({
  companyUuid,
  distributorUuid,
  distributorActive,
}: Props) {
  const { data, isLoading, error, refetch } = useDistributorLoginStatus(
    companyUuid,
    distributorUuid
  )
  const createMutation = useCreateDistributorLogin(companyUuid, distributorUuid)
  const statusMutation = useChangeDistributorLoginStatus(
    companyUuid,
    distributorUuid
  )
  const resetMutation = useResetDistributorLoginPassword(
    companyUuid,
    distributorUuid
  )

  const [pending, setPending] = useState<PendingAction>(null)
  const [credentials, setCredentials] =
    useState<DistributorLoginCredentialsResponse | null>(null)
  const [copied, setCopied] = useState(false)

  const exists = data?.exists ?? false
  const isActive = (data?.status ?? "").toUpperCase() === "ACTIVE"

  const onActionError = (error: unknown) =>
    toast.error(getApiErrorMessage(error, "Action failed"))

  const handleCreate = () => {
    createMutation.mutate(undefined, {
      onSuccess: (result) => setCredentials(result ?? null),
      onError: onActionError,
    })
  }

  const handleStatusConfirm = () => {
    if (!pending || pending === "reset" || pending === "disable") {
      if (pending === "disable") {
        statusMutation.mutate(
          { enabled: false },
          { onSuccess: () => setPending(null), onError: onActionError }
        )
        return
      }
      if (pending === "reset") {
        resetMutation.mutate(undefined, {
          onSuccess: (result) => {
            setPending(null)
            setCredentials(result ?? null)
          },
          onError: onActionError,
        })
        return
      }
      return
    }
    // pending === "enable"
    statusMutation.mutate(
      { enabled: true },
      {
        onSuccess: (result) => {
          setPending(null)
          if (result?.temporaryPassword) {
            setCredentials({
              username: result.username,
              temporaryPassword: result.temporaryPassword,
              mustChangePassword: result.mustChangePassword,
              emailDispatched: result.emailDispatched,
            })
          }
        },
        onError: onActionError,
      }
    )
  }

  const copyPassword = async () => {
    if (!credentials?.temporaryPassword) return
    try {
      await navigator.clipboard.writeText(credentials.temporaryPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard may be unavailable; ignore
    }
  }

  const isPending =
    createMutation.isPending ||
    statusMutation.isPending ||
    resetMutation.isPending

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-5" /> Distributor Login
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Spinner />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-4 text-sm">
            <p className="text-muted-foreground">
              {getApiErrorMessage(error, "Failed to load login status")}
            </p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {exists ? (
                <>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Username
                    </span>
                    <p className="font-mono font-medium">{data?.username}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Status
                    </span>
                    <p>
                      <StatusBadge status={data?.status ?? "INACTIVE"} />
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Last login
                    </span>
                    <p className="font-medium">
                      {formatDateTime(data?.lastLoginAt)}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No login provisioned for this distributor.
                </p>
              )}
            </div>

            <PermissionGate permission={PERMISSIONS.DISTRIBUTOR.LOGIN_MANAGE}>
              <div className="flex flex-wrap gap-2">
                {!exists ? (
                  <Button
                    onClick={handleCreate}
                    disabled={isPending || !distributorActive}
                    title={
                      !distributorActive
                        ? "Distributor must be active to create a login"
                        : undefined
                    }
                  >
                    <UserPlus className="mr-2 size-4" /> Create Login
                  </Button>
                ) : (
                  <>
                    <Button
                      variant={isActive ? "destructive" : "default"}
                      onClick={() =>
                        setPending(isActive ? "disable" : "enable")
                      }
                      disabled={isPending}
                    >
                      {isActive ? "Disable Login" : "Enable Login"}
                    </Button>
                    {isActive ? (
                      <Button
                        variant="outline"
                        onClick={() => setPending("reset")}
                        disabled={isPending}
                      >
                        <RefreshCw className="mr-2 size-4" /> Reset Password
                      </Button>
                    ) : null}
                  </>
                )}
              </div>
            </PermissionGate>
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={
          pending === "disable"
            ? "Disable login?"
            : pending === "enable"
              ? "Enable login?"
              : "Reset password?"
        }
        description={
          pending === "disable"
            ? "The distributor login will be deactivated and active sessions revoked."
            : pending === "enable"
              ? "A new one-time temporary password will be issued and emailed."
              : "A new one-time temporary password will be issued and active sessions revoked."
        }
        confirmLabel="Confirm"
        variant={pending === "disable" ? "destructive" : "default"}
        isLoading={isPending}
        onConfirm={handleStatusConfirm}
      />

      <Dialog
        open={credentials !== null}
        onOpenChange={(open) => !open && setCredentials(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="size-5" /> Temporary credentials
            </DialogTitle>
            <DialogDescription>
              Share these with the distributor. The password is shown once and
              is emailed best-effort.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 text-sm">
            <div>
              <span className="text-xs text-muted-foreground">Username</span>
              <p className="font-mono font-medium">
                {credentials?.username ?? "—"}
              </p>
            </div>
            {credentials?.temporaryPassword ? (
              <div>
                <span className="text-xs text-muted-foreground">
                  Temporary password
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 rounded-md border bg-muted px-3 py-2 font-mono text-sm">
                    {credentials.temporaryPassword}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => void copyPassword()}
                    aria-label="Copy password"
                  >
                    {copied ? (
                      <Check className="size-4" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              {credentials?.mustChangePassword ? (
                <Badge variant="secondary">Must change on first login</Badge>
              ) : null}
              {credentials?.emailDispatched ? (
                <Badge variant="secondary">Email sent</Badge>
              ) : null}
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setCredentials(null)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
