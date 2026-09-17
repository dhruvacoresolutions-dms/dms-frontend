"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { RoleCombobox } from "@/features/roles/components/RoleCombobox"
import { PermissionSetCombobox } from "@/features/permission-sets/components/PermissionSetCombobox"
import { BulkLoginCredentialsDialog } from "./BulkLoginCredentialsDialog"
import { employeeLabel, type EmployeeBulkActions } from "../hooks/use-employee-bulk-actions"

type Props = {
  companyUuid: string
  actions: EmployeeBulkActions
}

/** Shared dialogs for bulk employee actions (enable/disable login, assign permission set). */
export function EmployeeBulkActionDialogs({ companyUuid, actions }: Props) {
  const {
    withoutLogin,
    withLogin,
    withActiveLogin,
    withoutActiveLogin,
    busy,
    enableOpen,
    disableOpen,
    setDisableOpen,
    psOpen,
    roleUuid,
    setRoleUuid,
    permissionSetUuid,
    setPermissionSetUuid,
    credentials,
    setCredentials,
    enableMutation,
    disableMutation,
    psBusy,
    closeEnable,
    closePs,
    handleEnable,
    handleDisable,
    handleAssignPs,
  } = actions

  return (
    <>
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

      {/* ── Bulk Disable Login (ACTIVE logins only) ── */}
      <ConfirmDialog
        open={disableOpen}
        onOpenChange={(next) => !next && !busy && setDisableOpen(false)}
        title={`Disable login for ${withActiveLogin.length} ${withActiveLogin.length === 1 ? "employee" : "employees"}?`}
        description={
          withActiveLogin.length > 0
            ? `${withActiveLogin.slice(0, 5).map(employeeLabel).join(", ")}${withActiveLogin.length > 5 ? ` and ${withActiveLogin.length - 5} more` : ""} will no longer be able to log in.` +
              (withoutActiveLogin.length > 0
                ? ` ${withoutActiveLogin.length} selected without an active login will be skipped.`
                : "")
            : "None of the selected employees have an active login."
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
