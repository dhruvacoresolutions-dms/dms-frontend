"use client"

import { toast } from "sonner"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { useDeletePermissionSet } from "../hooks/use-delete-permission-set"
import {
  getPermissionSetErrorMessage,
  getPermissionSetId,
} from "../utils/permission-set.utils"
import type { PermissionSetListItem } from "../api/permission-set.types"

type PermissionSetDeleteDialogProps = {
  companyUuid: string
  target: PermissionSetListItem | null
  onClose: () => void
}

export function PermissionSetDeleteDialog({
  companyUuid,
  target,
  onClose,
}: PermissionSetDeleteDialogProps) {
  const deleteMutation = useDeletePermissionSet(companyUuid)

  return (
    <ConfirmDialog
      open={!!target}
      onOpenChange={(open) => !open && onClose()}
      title="Delete Permission Set?"
      description={
        target
          ? `Are you sure you want to delete "${target.name}" (${target.code})? This may affect users assigned to it.`
          : undefined
      }
      confirmLabel="Delete"
      variant="destructive"
      isLoading={deleteMutation.isPending}
      onConfirm={() => {
        if (!target) return
        deleteMutation.mutate(getPermissionSetId(target), {
          onSuccess: () => {
            toast.success("Permission set deleted")
            onClose()
          },
          onError: (error) =>
            toast.error(
              getPermissionSetErrorMessage(error, "Failed to delete permission set")
            ),
        })
      }}
    />
  )
}
