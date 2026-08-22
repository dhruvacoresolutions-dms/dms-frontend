"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { LoadingState } from "@/components/common/LoadingState"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { useRoles } from "@/features/roles/hooks/use-roles"
import { usePermissionSets } from "@/features/permission-sets/hooks/use-permission-sets"
import {
  useRoleAssignments,
  useAssignRole,
  useRemoveRoleAssignment,
} from "@/features/users/hooks/use-role-assignments"
import {
  usePermissionSetAssignments,
  useAssignPermissionSet,
  useRemovePermissionSetAssignment,
} from "@/features/users/hooks/use-permission-set-assignments"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"

type Props = {
  companyUuid: string
  userUuid: string
}

export function UserAssignmentsSection({ companyUuid, userUuid }: Props) {
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [psDialogOpen, setPsDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [selectedPs, setSelectedPs] = useState<string>("")
  const [removeTarget, setRemoveTarget] = useState<{
    type: "role" | "ps"
    uuid: string
    label: string
  } | null>(null)

  const roleAssignments = useRoleAssignments(companyUuid, userUuid)
  const psAssignments = usePermissionSetAssignments(companyUuid, userUuid)
  const roles = useRoles(companyUuid)
  const permissionSets = usePermissionSets(companyUuid)
  const assignRoleMutation = useAssignRole(companyUuid, userUuid)
  const removeRoleMutation = useRemoveRoleAssignment(companyUuid, userUuid)
  const assignPsMutation = useAssignPermissionSet(companyUuid, userUuid)
  const removePsMutation = useRemovePermissionSetAssignment(companyUuid, userUuid)

  if (roleAssignments.isLoading || psAssignments.isLoading) return <LoadingState />
  if (roleAssignments.error || psAssignments.error) return <ErrorState />

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Role Assignments</h3>
          <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <Plus className="mr-2 size-4" />
              Assign Role
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Role</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Select value={selectedRole} onValueChange={(v) => { if (v !== null) setSelectedRole(v) }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.data
                      ?.filter(
                        (r) =>
                          !roleAssignments.data?.some(
                            (a) => a.code === r.code
                          )
                      )
                      .map((role) => (
                        <SelectItem key={role.publicId} value={role.publicId}>
                          {role.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setRoleDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={!selectedRole || assignRoleMutation.isPending}
                    onClick={() => {
                      if (!selectedRole) return
                      assignRoleMutation.mutate(
                        {
                          rolePublicId: selectedRole,
                          contextType: "COMPANY",
                          scopeType: "COMPANY",
                        },
                        {
                          onSuccess: () => {
                            toast.success("Role assigned successfully")
                            setRoleDialogOpen(false)
                            setSelectedRole("")
                          },
                          onError: (error) => {
                            toast.error(
                              getApiErrorMessage(error, "Failed to assign role")
                            )
                          },
                        }
                      )
                    }}
                  >
                    {assignRoleMutation.isPending ? "Assigning..." : "Assign"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {!roleAssignments.data || roleAssignments.data.length === 0 ? (
          <EmptyState title="No roles assigned" description="Assign a role to this user." />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {roleAssignments.data.map((a) => (
                  <TableRow key={a.publicId}>
                    <TableCell className="font-mono">{a.code}</TableCell>
                    <TableCell>{a.status}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          setRemoveTarget({
                            type: "role",
                            uuid: a.publicId,
                            label: a.code,
                          })
                        }
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Permission Set Assignments</h3>
          <Dialog open={psDialogOpen} onOpenChange={setPsDialogOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <Plus className="mr-2 size-4" />
              Assign Permission Set
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Permission Set</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Select value={selectedPs} onValueChange={(v) => { if (v !== null) setSelectedPs(v) }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a permission set" />
                  </SelectTrigger>
                  <SelectContent>
                    {permissionSets.data
                      ?.filter(
                        (ps) =>
                          !psAssignments.data?.some(
                            (a) => a.code === ps.code
                          )
                      )
                      .map((ps) => (
                        <SelectItem key={ps.publicId} value={ps.publicId}>
                          {ps.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={!selectedPs || assignPsMutation.isPending}
                    onClick={() => {
                      if (!selectedPs) return
                      assignPsMutation.mutate(
                        { permissionSetPublicId: selectedPs },
                        {
                          onSuccess: () => {
                            toast.success("Permission set assigned successfully")
                            setPsDialogOpen(false)
                            setSelectedPs("")
                          },
                          onError: (error) => {
                            toast.error(
                              getApiErrorMessage(
                                error,
                                "Failed to assign permission set"
                              )
                            )
                          },
                        }
                      )
                    }}
                  >
                    {assignPsMutation.isPending ? "Assigning..." : "Assign"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {!psAssignments.data || psAssignments.data.length === 0 ? (
          <EmptyState
            title="No permission sets assigned"
            description="Assign a permission set to this user."
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {psAssignments.data.map((a) => (
                  <TableRow key={a.publicId}>
                    <TableCell className="font-mono">{a.code}</TableCell>
                    <TableCell>{a.status}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          setRemoveTarget({
                            type: "ps",
                            uuid: a.publicId,
                            label: a.code,
                          })
                        }
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title={`Remove ${removeTarget?.type === "role" ? "role" : "permission set"}?`}
        description={`This will remove "${removeTarget?.label}" from this user.`}
        confirmLabel="Remove"
        variant="destructive"
        isLoading={
          removeTarget?.type === "role"
            ? removeRoleMutation.isPending
            : removePsMutation.isPending
        }
        onConfirm={() => {
          if (!removeTarget) return
          if (removeTarget.type === "role") {
            removeRoleMutation.mutate(removeTarget.uuid, {
              onSuccess: () => {
                toast.success("Role removed successfully")
                setRemoveTarget(null)
              },
              onError: (error) => {
                toast.error(getApiErrorMessage(error, "Failed to remove role"))
              },
            })
          } else {
            removePsMutation.mutate(removeTarget.uuid, {
              onSuccess: () => {
                toast.success("Permission set removed successfully")
                setRemoveTarget(null)
              },
              onError: (error) => {
                toast.error(
                  getApiErrorMessage(error, "Failed to remove permission set")
                )
              },
            })
          }
        }}
      />
    </div>
  )
}
