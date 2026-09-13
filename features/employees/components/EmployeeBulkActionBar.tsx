"use client"

import * as React from "react"
import { KeyRound, UserCheck, UserX } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { assignPermissionSet } from "@/features/users/api/user.api"
import type { BulkOperationSummary, EmployeeResponse } from "../api/employee.types"
import {
  useBulkDisableEmployeeLogin,
  useBulkEnableEmployeeLogin,
} from "../hooks/use-bulk-employee-login"
import { RoleCombobox } from "@/features/roles/components/RoleCombobox"
import { PermissionSetCombobox } from "@/features/permission-sets/components/PermissionSetCombobox"
import { BulkLoginCredentialsDialog } from "./BulkLoginCredentialsDialog"

type Props = {
  companyUuid: string
  selected: EmployeeResponse[]
  onClear: () => void
  /** Refetch lists after bulk work finishes */
  onComplete: () => void
}

function employeeId(emp: EmployeeResponse): string {
  return emp.employeeUuid ?? emp.publicId
}

function employeeLabel(emp: EmployeeResponse): string {
  const name = `${emp.firstName} ${emp.lastName}`.trim()
  return name ? `${name} (${emp.employeeCode})` : emp.employeeCode
}

export function EmployeeBulkActionBar({
  companyUuid,
  selected,
  onClear,
  onComplete,
}: Props) {
  const [enableOpen, setEnableOpen] = React.useState(false)
  const [disableOpen, setDisableOpen] = React.useState(false)
  const [psOpen, setPsOpen] = React.useState(false)
  const [roleUuid, setRoleUuid] = React.useState<string>("")
  const [permissionSetUuid, setPermissionSetUuid] = React.useState<string>("")
  const [psBusy, setPsBusy] = React.useState(false)
  const [credentials, setCredentials] =
    React.useState<BulkOperationSummary | null>(null)

  const enableMutation = useBulkEnableEmployeeLogin(companyUuid)
  const disableMutation = useBulkDisableEmployeeLogin(companyUuid)

  if (selected.length === 0) return null

  // Login state is derived from the linked user: employees with a userUuid
  // already have login enabled.
  const withoutLogin = selected.filter((e) => !e.userUuid)
  const withLogin = selected.filter((e) => !!e.userUuid)
  const busy =
    enableMutation.isPending || disableMutation.isPending || psBusy

  const closeEnable = () => {
    setEnableOpen(false)
    setRoleUuid("")
  }
  const closePs = () => {
    setPsOpen(false)
    setPermissionSetUuid("")
  }
  const handleEnable = () => {
    if (!roleUuid || withoutLogin.length === 0) return
    enableMutation.mutate(
      {
        employeeUuids: withoutLogin.map(employeeId),
        roleUuid,
      },
      {
        onSuccess: (data) => {
          const { successful: ok, failed: fail, skipped } = data
          if (fail === 0) {
            toast.success(`Login enabled for ${ok} ${ok === 1 ? "employee" : "employees"}`)
          } else if (ok === 0) {
            toast.error(`Enable login failed for all ${fail}`)
          } else {
            toast.warning(`Login enabled for ${ok}, failed for ${fail}`)
          }
          if (skipped > 0) toast.info(`${skipped} skipped by server`)
          closeEnable()
          // Show generated credentials (one-time visible) when present.
          if (data.results.length > 0) setCredentials(data)
          onComplete()
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error, "Bulk enable login failed"))
        },
      }
    )
  }

  const handleDisable = () => {
    if (withLogin.length === 0) return
    disableMutation.mutate(
      { employeeUuids: withLogin.map(employeeId) },
      {
        onSuccess: (data) => {
          const { successful: ok, failed: fail, skipped } = data
          if (fail === 0) {
            toast.success(`Login disabled for ${ok} ${ok === 1 ? "employee" : "employees"}`)
          } else if (ok === 0) {
            toast.error(`Disable login failed for all ${fail}`)
          } else {
            toast.warning(`Login disabled for ${ok}, failed for ${fail}`)
          }
          if (skipped > 0) toast.info(`${skipped} skipped by server`)
          setDisableOpen(false)
          onComplete()
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error, "Bulk disable login failed"))
        },
      }
    )
  }

  const handleAssignPs = async () => {
    if (!permissionSetUuid || withLogin.length === 0) return
    setPsBusy(true)
    try {
      const results = await Promise.allSettled(
        withLogin.map((emp) =>
          assignPermissionSet(companyUuid, emp.userUuid as string, {
            permissionSetPublicId: permissionSetUuid,
          })
        )
      )
      const ok = results.filter((r) => r.status === "fulfilled").length
      const fail = results.length - ok
      if (fail === 0) {
        toast.success(`Permission set assigned to ${ok} ${ok === 1 ? "employee" : "employees"}`)
      } else if (ok === 0) {
        toast.error(`Assign failed for all ${fail}`)
      } else {
        toast.warning(`Assigned to ${ok}, failed for ${fail}`)
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Bulk assign failed"))
    } finally {
      setPsBusy(false)
      closePs()
      onComplete()
    }
  }

  return (
    <>
      <div className="fixed bottom-6 left-1/2 z-40 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-2xl border bg-background px-4 py-2 shadow-lg">
        <span className="text-sm whitespace-nowrap">
          <span className="font-semibold">{selected.length}</span>{" "}
          <span className="text-muted-foreground">
            {selected.length === 1 ? "employee" : "employees"} selected
          </span>
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => setEnableOpen(true)}
        >
          <UserCheck className="mr-1.5 size-4" />
          Enable Login
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => setDisableOpen(true)}
        >
          <UserX className="mr-1.5 size-4" />
          Disable Login
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => setPsOpen(true)}
        >
          <KeyRound className="mr-1.5 size-4" />
          Assign Permission Set
        </Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={onClear}>
          Clear
        </Button>
      </div>

      {/* ── Bulk Enable Login ── */}
      <Dialog
        open={enableOpen}
        onOpenChange={(next) => !next && !busy && closeEnable()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Enable login for {withoutLogin.length}{" "}
              {withoutLogin.length === 1 ? "employee" : "employees"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {withLogin.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {withLogin.length} selected{" "}
                {withLogin.length === 1 ? "employee already has" : "employees already have"}{" "}
                login and will be skipped.
              </p>
            )}
            <RoleCombobox
              companyUuid={companyUuid}
              value={roleUuid || null}
              onValueChange={(v) => setRoleUuid(v ?? "")}
              placeholder="Select a role for the new logins..."
              status="ACTIVE"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                disabled={busy}
                onClick={closeEnable}
              >
                Cancel
              </Button>
              <Button
                disabled={!roleUuid || withoutLogin.length === 0 || busy}
                onClick={handleEnable}
              >
                {enableMutation.isPending ? "Enabling..." : "Enable Login"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Generated credentials (one-time view) ── */}
      <BulkLoginCredentialsDialog
        data={credentials}
        onClose={() => setCredentials(null)}
      />

      {/* ── Bulk Disable Login ── */}
      <ConfirmDialog
        open={disableOpen}
        onOpenChange={(next) => !next && !busy && setDisableOpen(false)}
        title={`Disable login for ${withLogin.length} ${withLogin.length === 1 ? "employee" : "employees"}?`}
        description={
          withLogin.length > 0
            ? `${withLogin.slice(0, 5).map(employeeLabel).join(", ")}${withLogin.length > 5 ? ` and ${withLogin.length - 5} more` : ""} will no longer be able to log in.` +
              (withoutLogin.length > 0
                ? ` ${withoutLogin.length} selected without login will be skipped.`
                : "")
            : "None of the selected employees have login enabled."
        }
        confirmLabel="Disable Login"
        variant="destructive"
        isLoading={disableMutation.isPending}
        onConfirm={handleDisable}
      />

      {/* ── Bulk Assign Permission Set ── */}
      <Dialog open={psOpen} onOpenChange={(next) => !next && !busy && closePs()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Assign permission set to {withLogin.length}{" "}
              {withLogin.length === 1 ? "employee" : "employees"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {withoutLogin.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {withoutLogin.length} selected{" "}
                {withoutLogin.length === 1 ? "employee has" : "employees have"}{" "}
                no login (no linked user) and will be skipped.
              </p>
            )}
            <PermissionSetCombobox
              companyUuid={companyUuid}
              value={permissionSetUuid || null}
              onValueChange={(v) => setPermissionSetUuid(v ?? "")}
              placeholder="Select a permission set..."
              status="ACTIVE"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" disabled={busy} onClick={closePs}>
                Cancel
              </Button>
              <Button
                disabled={
                  !permissionSetUuid || withLogin.length === 0 || busy
                }
                onClick={handleAssignPs}
              >
                {psBusy ? "Assigning..." : "Assign"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
