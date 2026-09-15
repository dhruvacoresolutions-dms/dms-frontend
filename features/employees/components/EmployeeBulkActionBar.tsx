"use client"

import { KeyRound, UserCheck, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { EmployeeResponse } from "../api/employee.types"
import { useEmployeeBulkActions } from "../hooks/use-employee-bulk-actions"
import { EmployeeBulkActionDialogs } from "./EmployeeBulkActionDialogs"

type Props = {
  companyUuid: string
  selected: EmployeeResponse[]
  onClear: () => void
  /** Refetch lists after bulk work finishes */
  onComplete: () => void
}

export function EmployeeBulkActionBar({
  companyUuid,
  selected,
  onClear,
  onComplete,
}: Props) {
  const actions = useEmployeeBulkActions(companyUuid, selected, onComplete)
  const { busy, setEnableOpen, setDisableOpen, setPsOpen } = actions

  return (
    <>
      {/* Dialogs stay mounted even after the selection is cleared so the
          credentials dialog can open on enable success. */}
      {selected.length > 0 && (
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
      )}

      <EmployeeBulkActionDialogs companyUuid={companyUuid} actions={actions} />
    </>
  )
}
