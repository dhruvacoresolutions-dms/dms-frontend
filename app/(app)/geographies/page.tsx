"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Search, MoreHorizontal, ToggleLeft, ToggleRight, MapPin, ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
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

const GEOGRAPHY_HIERARCHY = ["COUNTRY", "ZONE", "STATE", "REGION", "TERRITORY", "BEAT"] as const

const geoSchema = z
  .object({
    code: z.string().min(1, "Code is required").max(50).regex(/^[A-Za-z0-9_-]+$/, "Invalid code"),
    name: z.string().min(1, "Name is required").max(160),
    type: z.enum(["COUNTRY", "ZONE", "STATE", "REGION", "TERRITORY", "BEAT"], { required_error: "Type is required" }),
    parentType: z.enum(["COUNTRY", "ZONE", "STATE", "REGION", "TERRITORY", "BEAT"]).optional(),
    parentUuid: z.string().optional(),
    description: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type !== "COUNTRY") {
      if (!data.parentType) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["parentType"], message: "Parent type is required" })
      }
      if (!data.parentUuid) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["parentUuid"], message: "Parent is required" })
      }
      if (data.parentType && data.type) {
        const childIdx = GEOGRAPHY_HIERARCHY.indexOf(data.type as (typeof GEOGRAPHY_HIERARCHY)[number])
        const parentIdx = GEOGRAPHY_HIERARCHY.indexOf(data.parentType as (typeof GEOGRAPHY_HIERARCHY)[number])
        if (parentIdx !== -1 && childIdx !== -1 && parentIdx >= childIdx) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["parentType"],
            message: "Parent type must be higher than selected type",
          })
        }
      }
    }
  })

type GeoFormValues = z.infer<typeof geoSchema>

export default function GeographiesPage() {
  const companyUuid = useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [parentOpen, setParentOpen] = useState(false)
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
    defaultValues: { code: "", name: "", type: undefined, parentType: undefined, parentUuid: undefined, description: "" },
  })

  const typeValue = useWatch({ control, name: "type" })
  const parentTypeValue = useWatch({ control, name: "parentType" })
  const parentUuidValue = useWatch({ control, name: "parentUuid" })

  const allowedParentTypes = useMemo(() => {
    if (!typeValue || typeValue === "COUNTRY") return [] as GeographyType[]
    const idx = GEOGRAPHY_HIERARCHY.indexOf(typeValue as (typeof GEOGRAPHY_HIERARCHY)[number])
    if (idx <= 0) return [] as GeographyType[]
    return GEOGRAPHY_HIERARCHY.slice(0, idx) as unknown as GeographyType[]
  }, [typeValue])

  const needsParent = !!typeValue && typeValue !== "COUNTRY"

  // Clear parent fields when type changes to COUNTRY or parentType becomes invalid
  useEffect(() => {
    if (!typeValue || typeValue === "COUNTRY") {
      setValue("parentType", undefined as unknown as GeographyType, { shouldValidate: true })
      setValue("parentUuid", undefined, { shouldValidate: true })
      return
    }
    if (parentTypeValue && !allowedParentTypes.includes(parentTypeValue as GeographyType)) {
      setValue("parentType", undefined as unknown as GeographyType, { shouldValidate: true })
      setValue("parentUuid", undefined, { shouldValidate: true })
    }
  }, [typeValue, allowedParentTypes, parentTypeValue, setValue])

  // Clear parentUuid when parentType changes
  useEffect(() => {
    if (!parentTypeValue) {
      if (parentUuidValue) setValue("parentUuid", undefined, { shouldValidate: true })
      return
    }
    // when parentType changes, always reset parent selection to avoid stale id from previous type
  }, [parentTypeValue]) // eslint-disable-line react-hooks/exhaustive-deps

  const { data: parentOptionsData, isLoading: parentOptionsLoading } = useGeographies(
    companyUuid,
    {
      type: parentTypeValue as GeographyType,
      size: 100,
      status: "ACTIVE" as const,
    },
    { enabled: !!parentTypeValue && !!companyUuid && needsParent }
  )
  const parentOptions = parentOptionsData?.content ?? []
  const selectedParent = useMemo(
    () => parentOptions.find((g) => g.geographyUuid === parentUuidValue) ?? null,
    [parentOptions, parentUuidValue]
  )

  const handleOpenChange = (open: boolean) => {
    setCreateOpen(open)
    if (!open) {
      reset()
      setParentOpen(false)
    }
  }

  // Reset parentUuid when parentTypeValue changes (separate effect to avoid loop)
  const handleParentTypeChange = (v: string | null) => {
    if (!v) return
    setValue("parentType", v as GeographyType, { shouldValidate: true })
    setValue("parentUuid", undefined, { shouldValidate: true })
    setParentOpen(false)
  }

  const geographies = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Geographies"
        description="Manage geographical hierarchy"
        action={
          <Dialog open={createOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger render={<Button />}>
              <Plus className="mr-2 size-4" /> Create Geography
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Geography</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={handleSubmit((values) => {
                  const payload = {
                    code: values.code,
                    name: values.name,
                    type: values.type,
                    description: values.description || undefined,
                    ...(values.parentUuid ? { parentUuid: values.parentUuid } : {}),
                  }
                  createMutation.mutate(payload, {
                    onSuccess: () => { toast.success("Geography created"); reset(); setCreateOpen(false) },
                    onError: (error) => { toast.error(getApiErrorMessage(error, "Failed")) },
                  })
                })}
                className="space-y-4"
              >
                <FieldGroup>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
                      <Select value={typeValue ?? ""} onValueChange={(v: string | null) => v && setValue("type", v as GeographyType, { shouldValidate: true })}>
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
                    {needsParent && (
                      <Field>
                        <FieldLabel>Parent Type</FieldLabel>
                        <Select value={parentTypeValue ?? ""} onValueChange={handleParentTypeChange}>
                          <SelectTrigger aria-invalid={!!errors.parentType}>
                            <SelectValue placeholder="Select parent type" />
                          </SelectTrigger>
                          <SelectContent>
                            {allowedParentTypes.map((pt) => (
                              <SelectItem key={pt} value={pt}>
                                {pt.charAt(0) + pt.slice(1).toLowerCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldError errors={[errors.parentType]} />
                      </Field>
                    )}
                    {needsParent && parentTypeValue && (
                      <Field className={needsParent ? "lg:col-span-2" : undefined}>
                        <FieldLabel>Parent ({parentTypeValue.charAt(0) + parentTypeValue.slice(1).toLowerCase()})</FieldLabel>
                        <Popover open={parentOpen} onOpenChange={setParentOpen}>
                          <PopoverTrigger
                            render={
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={parentOpen}
                                aria-invalid={!!errors.parentUuid}
                                disabled={!parentTypeValue || parentOptionsLoading}
                                className={cn(
                                  "w-full justify-between font-normal",
                                  !selectedParent && "text-muted-foreground",
                                  !!errors.parentUuid && "border-destructive ring-destructive/20"
                                )}
                              />
                            }
                          >
                            {selectedParent ? `${selectedParent.name} (${selectedParent.code})` : parentOptionsLoading ? "Loading..." : `Select ${parentTypeValue.toLowerCase()}`}
                            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                          </PopoverTrigger>
                          <PopoverContent className="w-[--anchor-width] p-0" align="start">
                            <Command>
                              <CommandInput placeholder={`Search ${parentTypeValue.toLowerCase()}...`} />
                              <CommandList>
                                <CommandEmpty>No {parentTypeValue.toLowerCase()} found</CommandEmpty>
                                <CommandGroup>
                                  {parentOptions.map((g) => {
                                    const label = `${g.name} (${g.code})`
                                    return (
                                      <CommandItem
                                        key={g.geographyUuid}
                                        value={label}
                                        onSelect={() => {
                                          setValue("parentUuid", g.geographyUuid, { shouldValidate: true })
                                          setParentOpen(false)
                                        }}
                                      >
                                        <Check className={cn("mr-2 size-4", parentUuidValue === g.geographyUuid ? "opacity-100" : "opacity-0")} />
                                        {label}
                                      </CommandItem>
                                    )
                                  })}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FieldError errors={[errors.parentUuid]} />
                      </Field>
                    )}
                    <Field className={needsParent && parentTypeValue ? "lg:col-span-2" : "lg:col-span-2"}>
                      <FieldLabel>Description</FieldLabel>
                      <Input placeholder="Optional" {...register("description")} />
                      <FieldError errors={[errors.description]} />
                    </Field>
                  </div>
                </FieldGroup>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
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
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger onClick={(e) => e.stopPropagation()} className="cursor-pointer"><MoreHorizontal className="size-4" /></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setStatusToggle({ uuid: g.geographyUuid, currentStatus: g.status }) }}>
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
