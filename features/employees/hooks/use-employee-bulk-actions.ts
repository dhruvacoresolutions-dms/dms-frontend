"use client"

import * as React from "react"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { assignPermissionSet } from "@/features/users/api/user.api"
import type { BulkOperationSummary, EmployeeResponse } from "../api/employee.types"
import {
  useBulkDisableEmployeeLogin,
  useBulkEnableEmployeeLogin,
} from "./use-bulk-employee-login"

function employeeId(emp: EmployeeResponse): string {
  return emp.employeeUuid ?? emp.publicId
}

export function employeeLabel(emp: EmployeeResponse): string {
  const name = `${emp.firstName} ${emp.lastName}`.trim()
  return name ? `${name} (${emp.employeeCode})` : emp.employeeCode
}

export function useEmployeeBulkActions(
  companyUuid: string,
  selected: EmployeeResponse[],
  onComplete: () => void
) {
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

  // Login state is derived from the linked user: employees with a userUuid
  // already have login enabled.
  const withoutLogin = selected.filter((e) => !e.userUuid)
  const withLogin = selected.filter((e) => !!e.userUuid)
  // Bulk disable only applies to currently ACTIVE logins — employees whose
  // login is missing or already INACTIVE are skipped.
  const withActiveLogin = selected.filter((e) => e.loginStatus === "ACTIVE")
  const withoutActiveLogin = selected.filter(
    (e) => e.loginStatus !== "ACTIVE"
  )
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
    if (withActiveLogin.length === 0) return
    disableMutation.mutate(
      { employeeUuids: withActiveLogin.map(employeeId) },
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

  return {
    withoutLogin,
    withLogin,
    withActiveLogin,
    withoutActiveLogin,
    busy,
    enableOpen,
    setEnableOpen,
    disableOpen,
    setDisableOpen,
    psOpen,
    setPsOpen,
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
  }
}

export type EmployeeBulkActions = ReturnType<typeof useEmployeeBulkActions>
