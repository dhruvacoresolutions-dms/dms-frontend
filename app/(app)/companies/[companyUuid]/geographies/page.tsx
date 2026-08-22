"use client"

import { useState } from "react"
import { Plus, Search, MoreHorizontal, ToggleLeft, ToggleRight, MapPin } from "lucide-react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { StatusBadge } from "@/components/common/StatusBadge"
import { PageHeader } from "@/components/common/PageHeader"
import { TableSkeleton } from "@/components/common/LoadingState"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { useGeographies } from "@/features/geographies/hooks/use-geographies"
import { useCreateGeography } from "@/features/geographies/hooks/use-create-geography"
import { useUpdateGeographyStatus } from "@/features/geographies/hooks/use-update-geography-status"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"
import type { GeographyType } from "@/features/geographies/api/geography.types"

const geoSchema = z.object({
  code: z.string().min(1, "Code is required").max(50).regex(/^[A-Za-z0-9_-]+$/, "Invalid code"),
  name: z.string().min(1, "Name is required").max(160),
  type: z.enum(["COUNTRY", "ZONE", "STATE", "REGION", "TERRITORY", "BEAT"], { required_error: "Type is required" }),
  description: z.string().max(500).optional(),
})

type GeoFormValues = z.infer<typeof geoSchema>

export default function GeographiesPage() {
  const params = useParams<{ companyUuid: string }>()
  const companyUuid = params.companyUuid
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [statusToggle, setStatusToggle] = useState<{ uuid: string; currentStatus: string } | null>(null)

  const { data, isLoading, error, refetch } = useGeographies(companyUuid, {
    search: search || undefined,
    page,
    size: 20,
  })

  const createMutation = useCreateGeography(companyUuid)
  const updateStatusMutation = useUpdateGeographyStatus(companyUuid)

  const { register, handleSubmit, setValue, control, reset, formState: { errors } } = useForm<GeoFormValues>({
    resolver: zodResolver(geoSchema),
    defaultValues: { code: "", name: "", type: undefined, description: "" },
  })

  const typeValue = useWatch({ control, name: "type" })

  const geographies = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Geographies"
        description="Manage geographical hierarchy"
        action={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button />}>
              <Plus className="mr-2 size-4" /> Create Geography
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Geography</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={handleSubmit((values) =>
                  createMutation.mutate(values, {
                    onSuccess: () => { toast.success("Geography created"); reset(); setCreateOpen(false) },
                    onError: (error) => { toast.error(getApiErrorMessage(error, "Failed")) },
                  })
                )}
                className="space-y-4"
              >
                <FieldGroup>
                  <Field>
                    <FieldLabel>Code</FieldLabel>
                    <Input placeholder="e.g. IND" aria-invalid={!!errors.code} {...register("code")} />
                    <FieldError errors={[errors.code]} />
                  </Field>
                  <Field>
                    <FieldLabel>Name</FieldLabel>
                    <Input placeholder="e.g. India" aria-invalid={!!errors.name} {...register("name")} />
                    <FieldError errors={[errors.name]} />
                  </Field>
                  <Field>
                    <FieldLabel>Type</FieldLabel>
                    <Select value={typeValue} onValueChange={(v) => v && setValue("type", v as GeographyType)}>
                      <SelectTrigger aria-invalid={!!errors.type}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COUNTRY">Country</SelectItem>
                        <SelectItem value="ZONE">Zone</SelectItem>
                        <SelectItem value="STATE">State</SelectItem>
                        <SelectItem value="REGION">Region</SelectItem>
                        <SelectItem value="TERRITORY">Territory</SelectItem>
                        <SelectItem value="BEAT">Beat</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError errors={[errors.type]} />
                  </Field>
                  <Field>
                    <FieldLabel>Description</FieldLabel>
                    <Input placeholder="Optional" {...register("description")} />
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

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search geographies..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }} className="pl-9" />
        </div>
      </div>

      {isLoading ? <TableSkeleton rows={5} /> : error ? (
        <ErrorState onRetry={refetch} />
      ) : geographies.length === 0 ? (
        <EmptyState icon={MapPin} title="No geographies found" description={search ? "Try a different search." : "Create a geography to get started."} />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {geographies.map((g) => (
                  <TableRow key={g.geographyUuid}>
                    <TableCell className="font-mono text-sm">{g.code}</TableCell>
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell><Badge variant="secondary">{g.type}</Badge></TableCell>
                    <TableCell>{g.parentName ?? "-"}</TableCell>
                    <TableCell><StatusBadge status={g.status} /></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="cursor-pointer"><MoreHorizontal className="size-4" /></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setStatusToggle({ uuid: g.geographyUuid, currentStatus: g.status })}>
                            {g.status === "ACTIVE" ? <><ToggleLeft className="mr-2 size-4" /> Deactivate</> : <><ToggleRight className="mr-2 size-4" /> Activate</>}
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
              <p className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!statusToggle}
        onOpenChange={(open) => !open && setStatusToggle(null)}
        title="Update Status?"
        description="This will change the geography status."
        confirmLabel="Confirm"
        variant="destructive"
        isLoading={updateStatusMutation.isPending}
        onConfirm={() => {
          if (!statusToggle) return
          updateStatusMutation.mutate(
            { geographyUuid: statusToggle.uuid, input: { status: statusToggle.currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE" } },
            {
              onSuccess: () => { toast.success("Status updated"); setStatusToggle(null) },
              onError: (error) => { toast.error(getApiErrorMessage(error, "Failed")) },
            }
          )
        }}
      />
    </div>
  )
}