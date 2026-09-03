"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Plus, MoreHorizontal, ToggleLeft, ToggleRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/common/SearchInput"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { StatusBadge } from "@/components/common/StatusBadge"
import { PageHeader } from "@/components/common/PageHeader"
import { TableSkeleton } from "@/components/common/LoadingState"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { useDesignations } from "@/features/designations/hooks/use-designations"
import { useCreateDesignation } from "@/features/designations/hooks/use-create-designation"
import { useUpdateDesignationStatus } from "@/features/designations/hooks/use-update-designation-status"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"

const designationSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(50)
    .regex(/^[A-Za-z0-9_-]+$/, "Invalid code format"),
  name: z.string().min(1, "Name is required"),
  hierarchyLevel: z.coerce.number().int().min(1, "Hierarchy level required"),
  description: z.string().optional(),
})

type DesignationFormValues = z.infer<typeof designationSchema>

export default function DesignationsPage() {
  const params = useParams<{ companyUuid: string }>()
  const companyUuid = params.companyUuid
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [statusToggle, setStatusToggle] = useState<{
    uuid: string
    currentStatus: string
  } | null>(null)

  const { data, isLoading, error, refetch } = useDesignations(companyUuid, {
    query: search || undefined,
    page,
    size: 20,
  })

  const createMutation = useCreateDesignation(companyUuid)
  const updateStatusMutation = useUpdateDesignationStatus(companyUuid)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DesignationFormValues>({
    resolver: zodResolver(designationSchema),
    defaultValues: { code: "", name: "", hierarchyLevel: 10, description: "" },
  })

  const designations = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Designations"
        description="Manage job designations"
        action={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button />}>
              <Plus className="mr-2 size-4" /> Create Designation
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Designation</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={handleSubmit((values) =>
                  createMutation.mutate(values, {
                    onSuccess: () => {
                      toast.success("Designation created")
                      reset()
                      setCreateOpen(false)
                    },
                    onError: (error) => {
                      toast.error(getApiErrorMessage(error, "Failed"))
                    },
                  })
                )}
                className="space-y-4"
              >
                <FieldGroup>
                  <Field>
                    <FieldLabel>Code</FieldLabel>
                    <Input
                      placeholder="e.g. SR_MGR"
                      aria-invalid={!!errors.code}
                      {...register("code")}
                    />
                    <FieldError errors={[errors.code]} />
                  </Field>
                  <Field>
                    <FieldLabel>Name</FieldLabel>
                    <Input
                      placeholder="e.g. Senior Manager"
                      aria-invalid={!!errors.name}
                      {...register("name")}
                    />
                    <FieldError errors={[errors.name]} />
                  </Field>
                  <Field>
                    <FieldLabel>Hierarchy Level</FieldLabel>
                    <Input
                      type="number"
                      placeholder="e.g. 10"
                      aria-invalid={!!errors.hierarchyLevel}
                      {...register("hierarchyLevel", { valueAsNumber: true })}
                    />
                    <FieldError errors={[errors.hierarchyLevel]} />
                  </Field>
                  <Field>
                    <FieldLabel>Description</FieldLabel>
                    <Input placeholder="Optional description" {...register("description")} />
                  </Field>
                </FieldGroup>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex items-center gap-2">
        <SearchInput
          placeholder="Search designations..."
          defaultValue={search}
          onChange={(v) => {
            setSearch(v)
            setPage(0)
          }}
        />
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : designations.length === 0 ? (
        <EmptyState
          title="No designations found"
          description={
            search ? "Try a different search." : "Create a designation to get started."
          }
        />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {designations.map((d) => (
                  <TableRow key={d.publicId ?? d.designationUuid}>
                    <TableCell className="font-mono text-sm">{d.code}</TableCell>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {d.description ?? "-"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={d.status} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="cursor-pointer">
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              setStatusToggle({
                                uuid: d.publicId ?? d.designationUuid,
                                currentStatus: d.status,
                              })
                            }
                          >
                            {d.status === "ACTIVE" ? (
                              <>
                                <ToggleLeft className="mr-2 size-4" /> Deactivate
                              </>
                            ) : (
                              <>
                                <ToggleRight className="mr-2 size-4" /> Activate
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!statusToggle}
        onOpenChange={(open) => !open && setStatusToggle(null)}
        title="Update Status?"
        description="This will change the designation status."
        confirmLabel="Confirm"
        variant="destructive"
        isLoading={updateStatusMutation.isPending}
        onConfirm={() => {
          if (!statusToggle) return
          updateStatusMutation.mutate(
            {
              designationUuid: statusToggle.uuid,
              input: {
                status: statusToggle.currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE",
              },
            },
            {
              onSuccess: () => {
                toast.success("Status updated")
                setStatusToggle(null)
              },
              onError: (error) => {
                toast.error(getApiErrorMessage(error, "Failed"))
              },
            }
          )
        }}
      />
    </div>
  )
}
