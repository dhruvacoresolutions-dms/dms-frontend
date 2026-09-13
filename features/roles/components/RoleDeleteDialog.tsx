"use client"

import { toast } from "sonner"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { useDeleteRole } from "../hooks/use-delete-role"
import { getRoleErrorMessage, getRoleId } from "../utils/role.utils"
import type { RoleListItem } from "../api/role.types"

type RoleDeleteDialogProps = {
  companyUuid: string
  target: RoleListItem | null
  onClose: () => void
}

export function RoleDeleteDialog({
  companyUuid,
  target,
  onClose,
}: RoleDeleteDialogProps) {
  const deleteMutation = useDeleteRole(companyUuid)

  return (
    <ConfirmDialog
      open={!!target}
      onOpenChange={(open) => !open && onClose()}
      title="Delete Role?"
      description={
        target
          ? `Are you sure you want to delete "${target.name}" (${target.code})? This may affect users assigned to this role.`
          : undefined
      }
      confirmLabel="Delete"
      variant="destructive"
      isLoading={deleteMutation.isPending}
      onConfirm={() => {
        if (!target) return
        deleteMutation.mutate(getRoleId(target), {
          onSuccess: () => {
            toast.success("Role deleted")
            onClose()
          },
          onError: (error) =>
            toast.error(getRoleErrorMessage(error, "Failed to delete role")),
        })
      }}
    />
  )
}
