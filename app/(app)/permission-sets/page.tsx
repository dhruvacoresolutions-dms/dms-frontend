"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { KeyRound, Plus, MoreHorizontal, Eye, Edit, Key, Trash2 } from "lucide-react"
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
import { usePermissionSets } from "@/features/permission-sets/hooks/use-permission-sets"
import { useCreatePermissionSet } from "@/features/permission-sets/hooks/use-create-permission-set"
import { useDeletePermissionSet } from "@/features/permission-sets/hooks/use-delete-permission-set"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"

const psSchema = z.object({
  code: z.string().min(2).max(80).regex(/^[A-Z0-9_]+$/, "Must be uppercase letters, numbers, or underscores"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
})

type PSFormValues = z.infer<typeof psSchema>

export default function PermissionSetsPage() {
  const router = useRouter()
  const companyUuid = useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ uuid: string; name: string } | null>(null)

  const { data: sets, isLoading, error, refetch } = usePermissionSets(companyUuid)
  const createMutation = useCreatePermissionSet(companyUuid)
  const deleteMutation = useDeletePermissionSet(companyUuid)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PSFormValues>({
    resolver: zodResolver(psSchema),
    defaultValues: { code: "", name: "", description: "" },
  })

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Permission Sets"
        description="Manage permission sets"
        action={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button />}>
              <Plus className="mr-2 size-4" /> Create Permission Set
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Permission Set</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={handleSubmit((values) =>
                  createMutation.mutate(values, {
                    onSuccess: () => { toast.success("Permission set created"); reset(); setCreateOpen(false) },
                    onError: (error) => { toast.error(getApiErrorMessage(error, "Failed")) },
                  })
                )}
                className="space-y-4"
              >
                <FieldGroup>
                  <Field>
                    <FieldLabel>Code</FieldLabel>
                    <Input placeholder="e.g. SALES_ACCESS" aria-invalid={!!errors.code} {...register("code")} />
                    <FieldError errors={[errors.code]} />
                  </Field>
                  <Field>
                    <FieldLabel>Name</FieldLabel>
                    <Input placeholder="e.g. Sales Access" aria-invalid={!!errors.name} {...register("name")} />
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
      ) : !sets || sets.length === 0 ? (
        <EmptyState icon={KeyRound} title="No permission sets found" description="Create a permission set to get started." />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sets.map((ps) => (
                <TableRow
                  key={ps.publicId}
                  className="cursor-pointer"
                  onClick={() => router.push(`/permission-sets/${ps.publicId}`)}
                >
                  <TableCell className="font-mono text-sm">{ps.code}</TableCell>
                  <TableCell className="font-medium">{ps.name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">{ps.description ?? "-"}</TableCell>
                  <TableCell><Badge variant="secondary">{ps.permissions.length}</Badge></TableCell>
                  <TableCell>{ps.assignedUserCount}</TableCell>
                  <TableCell><StatusBadge status={ps.status} /></TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger onClick={(e) => e.stopPropagation()} className="cursor-pointer">
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/permission-sets/${ps.publicId}`) }}>
                          <Eye className="mr-2 size-4" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/permission-sets/${ps.publicId}/edit`) }}>
                          <Edit className="mr-2 size-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/permission-sets/${ps.publicId}/permissions`) }}>
                          <Key className="mr-2 size-4" /> Manage Permissions
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeleteTarget({ uuid: ps.publicId, name: ps.name }) }}>
                          <Trash2 className="mr-2 size-4 text-destructive" /> Delete
                        </DropdownMenuItem>
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
        title="Delete Permission Set?"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This may affect users assigned to it.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteTarget) return
          deleteMutation.mutate(deleteTarget.uuid, {
            onSuccess: () => { toast.success("Permission set deleted"); setDeleteTarget(null) },
            onError: (error) => { toast.error(getApiErrorMessage(error, "Failed")) },
          })
        }}
      />
    </div>
  )
}
