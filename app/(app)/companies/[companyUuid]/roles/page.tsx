"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Shield, Plus, MoreHorizontal, Eye, Edit, Key, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/common/StatusBadge"
import { PageHeader } from "@/components/common/PageHeader"
import { TableSkeleton } from "@/components/common/LoadingState"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { useRoles } from "@/features/roles/hooks/use-roles"
import { useCreateRole } from "@/features/roles/hooks/use-create-role"
import { useDeleteRole } from "@/features/roles/hooks/use-delete-role"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"

const roleSchema = z.object({
  code: z.string().min(2, "Code must be at least 2 characters").max(80).regex(/^[A-Z0-9_]+$/, "Must be uppercase letters, numbers, or underscores"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
})

type RoleFormValues = z.infer<typeof roleSchema>

export default function RolesPage() {
  const params = useParams<{ companyUuid: string }>()
  const router = useRouter()
  const companyUuid = params.companyUuid
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ uuid: string; name: string } | null>(null)

  const { data: roles, isLoading, error, refetch } = useRoles(companyUuid)
  const createMutation = useCreateRole(companyUuid)
  const deleteMutation = useDeleteRole(companyUuid)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: { code: "", name: "", description: "" },
  })

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Roles"
        description="Manage company roles"
        action={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button />}>
              <Plus className="mr-2 size-4" /> Create Role
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Role</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={handleSubmit((values) =>
                  createMutation.mutate(values, {
                    onSuccess: () => { toast.success("Role created"); reset(); setCreateOpen(false) },
                    onError: (error) => { toast.error(getApiErrorMessage(error, "Failed")) },
                  })
                )}
                className="space-y-4"
              >
                <FieldGroup>
                  <Field>
                    <FieldLabel>Code</FieldLabel>
                    <Input placeholder="e.g. SALES_MANAGER" aria-invalid={!!errors.code} {...register("code")} />
                    <FieldError errors={[errors.code]} />
                  </Field>
                  <Field>
                    <FieldLabel>Name</FieldLabel>
                    <Input placeholder="e.g. Sales Manager" aria-invalid={!!errors.name} {...register("name")} />
                    <FieldError errors={[errors.name]} />
                  </Field>
                  <Field>
                    <FieldLabel>Description</FieldLabel>
                    <Input placeholder="Optional description" {...register("description")} />
                  </Field>
                </FieldGroup>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? <TableSkeleton rows={5} /> : error ? (
        <ErrorState onRetry={refetch} />
      ) : !roles || roles.length === 0 ? (
        <EmptyState icon={Shield} title="No roles found" description="Create a role to get started." />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow
                  key={role.publicId}
                  className="cursor-pointer"
                  onClick={() => router.push(`/companies/${companyUuid}/roles/${role.publicId}`)}
                >
                  <TableCell className="font-mono text-sm">{role.code}</TableCell>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">{role.description ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{role.permissions.length}</Badge>
                  </TableCell>
                  <TableCell>
                    {role.systemDefined ? (
                      <Badge variant="outline">System</Badge>
                    ) : (
                      <Badge variant="secondary">Custom</Badge>
                    )}
                  </TableCell>
                  <TableCell><StatusBadge status={role.status} /></TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger onClick={(e) => e.stopPropagation()} className="cursor-pointer">
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/companies/${companyUuid}/roles/${role.publicId}`) }}>
                          <Eye className="mr-2 size-4" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/companies/${companyUuid}/roles/${role.publicId}/edit`) }}>
                          <Edit className="mr-2 size-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/companies/${companyUuid}/roles/${role.publicId}/permissions`) }}>
                          <Key className="mr-2 size-4" /> Manage Permissions
                        </DropdownMenuItem>
                        {!role.systemDefined && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeleteTarget({ uuid: role.publicId, name: role.name }) }}>
                              <Trash2 className="mr-2 size-4 text-destructive" /> Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Role?"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This may affect users assigned to this role.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteTarget) return
          deleteMutation.mutate(deleteTarget.uuid, {
            onSuccess: () => { toast.success("Role deleted"); setDeleteTarget(null) },
            onError: (error) => { toast.error(getApiErrorMessage(error, "Failed to delete role")) },
          })
        }}
      />
    </div>
  )
}
