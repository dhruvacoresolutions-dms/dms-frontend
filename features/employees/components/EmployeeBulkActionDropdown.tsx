"use client"

import { ChevronDown, KeyRound, UserCheck, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { EmployeeResponse } from "../api/employee.types"
import { useEmployeeBulkActions } from "../hooks/use-employee-bulk-actions"
import { EmployeeBulkActionDialogs } from "./EmployeeBulkActionDialogs"

type Props = {
  companyUuid: string
  selected: EmployeeResponse[]
  /** Refetch lists after bulk work finishes */
  onComplete: () => void
}

/**
 * Bulk actions for multi-selected employees, shown as a primary Actions
 * dropdown next to the filters. The trigger only appears when at least one
 * employee is selected; dialogs stay mounted so the credentials dialog can
 * open on enable success even after the selection is cleared.
 */
export function EmployeeBulkActionDropdown({
  companyUuid,
  selected,
  onComplete,
}: Props) {
  const actions = useEmployeeBulkActions(companyUuid, selected, onComplete)
  const { busy, setEnableOpen, setDisableOpen, setPsOpen } = actions

  return (
    <>
      {selected.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button />}>
            Actions ({selected.length})
            <ChevronDown className="ml-1 size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-auto min-w-48">
            <DropdownMenuItem disabled={busy} onClick={() => setEnableOpen(true)}>
              <UserCheck className="mr-2 size-4" /> Enable Login
            </DropdownMenuItem>
            <DropdownMenuItem disabled={busy} onClick={() => setDisableOpen(true)}>
              <UserX className="mr-2 size-4" /> Disable Login
            </DropdownMenuItem>
            <DropdownMenuItem disabled={busy} onClick={() => setPsOpen(true)}>
              <KeyRound className="mr-2 size-4" /> Assign Permission Set
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <EmployeeBulkActionDialogs companyUuid={companyUuid} actions={actions} />
    </>
  )
}
