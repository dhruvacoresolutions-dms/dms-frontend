"use client"

import { useMemo, useState } from "react"
import {
  MoreHorizontal,
  Pencil,
  Plus,
  ToggleLeft,
  ToggleRight,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SearchInput } from "@/components/common/SearchInput"
import { StatusFilterSelect } from "@/components/common/StatusFilterSelect"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { StatusBadge } from "@/components/common/StatusBadge"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { PERMISSIONS } from "@/lib/permissions"
import { useCustomerMasters } from "../hooks/use-customer-masters"
import { useUpdateCustomerMasterStatus } from "../hooks/use-update-customer-master-status"
import { useCustomerTypes } from "../hooks/use-customer-types"
import { useCustomerLookupTypes } from "../hooks/use-customer-lookup-types"
import { CustomerMasterFormDialog } from "./CustomerMasterFormDialog"
import type {
  CustomerLookupType,
  CustomerMasterResponse,
  CustomerMasterStatus,
} from "../api/customer.types"
import type { CustomerMasterConfig } from "../lib/customer-master-config"

type Props = {
  companyUuid: string
  config: CustomerMasterConfig
}

export function CustomerMasterManager({ companyUuid, config }: Props) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("ALL")
  const [lookupType, setLookupType] = useState<"ALL" | CustomerLookupType>("ALL")
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CustomerMasterResponse | null>(null)
  const [statusToggle, setStatusToggle] =
    useState<CustomerMasterResponse | null>(null)

  const { data, isLoading, error, refetch } = useCustomerMasters(
    companyUuid,
    config.kind,
    {
      search: search || undefined,
      status: status === "ALL" ? undefined : (status as CustomerMasterStatus),
      lookupType:
        config.requiresLookupType && lookupType !== "ALL"
          ? lookupType
          : undefined,
      sort: "displayOrder,asc",
      page,
      size,
    }
  )

  // Parent name resolution for hierarchical kinds.
  const { data: allRows } = useCustomerMasters(
    companyUuid,
    config.kind,
    { activeOnly: false, page: 0, size: 100 },
    { enabled: !!config.allowsParent }
  )
  const { data: customerTypes } = useCustomerTypes(companyUuid)
  const { data: lookupTypes } = useCustomerLookupTypes(companyUuid)

  const statusMutation = useUpdateCustomerMasterStatus(companyUuid, config.kind)

  const customerTypeNames = useMemo(() => {
    const map = new Map<string, string>()
    for (const t of customerTypes ?? []) map.set(t.uuid, t.name)
    return map
  }, [customerTypes])

  const lookupTypeLabels = useMemo(() => {
    const map = new Map<string, string>()
    for (const t of lookupTypes ?? []) map.set(t.code, t.label)
    return map
  }, [lookupTypes])

  const parentNames = useMemo(() => {
    const map = new Map<string, string>()
    for (const row of allRows?.content ?? []) map.set(row.uuid, row.name)
    return map
  }, [allRows?.content])

  const rows = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const lower = config.singular.toLowerCase()

  const columns = useMemo<DataTableColumn<CustomerMasterResponse>[]>(() => {
    const base: DataTableColumn<CustomerMasterResponse>[] = [
      {
        id: "code",
        header: "Code",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.code}</span>
        ),
      },
      {
        id: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
    ]

    if (config.requiresCustomerType) {
      base.push({
        id: "customerType",
        header: "Customer Type",
        cell: ({ row }) => {
          const uuid = row.original.customerTypeUuid
          if (!uuid) return "—"
          return customerTypeNames.get(uuid) ?? "—"
        },
      })
    }

    if (config.allowsParent) {
      base.push({
        id: "parent",
        header: "Parent",
        cell: ({ row }) => {
          const uuid = row.original.parentUuid
          if (!uuid) return <span className="text-muted-foreground">Top level</span>
          return parentNames.get(uuid) ?? "—"
        },
      })
    }

    if (config.hasRankLevel) {
      base.push({
        id: "rankLevel",
        header: "Rank",
        cell: ({ row }) =>
          row.original.rankLevel != null ? (
            <span className="tabular-nums">{row.original.rankLevel}</span>
          ) : (
            "—"
          ),
      })
    }

    if (config.requiresLookupType) {
      base.push({
        id: "lookupType",
        header: "Lookup Type",
        cell: ({ row }) => {
          const code = row.original.lookupType
          if (!code) return "—"
          return lookupTypeLabels.get(code) ?? code
        },
      })
    }

    base.push(
      {
        id: "displayOrder",
        header: "Order",
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.displayOrder}</span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const item = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer" aria-label="Row actions">
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto min-w-40">
                <PermissionGate permission={PERMISSIONS.CUSTOMER.UPDATE}>
                  <DropdownMenuItem
                    onClick={() => {
                      setEditing(item)
                      setDialogOpen(true)
                    }}
                  >
                    <Pencil className="mr-2 size-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant={
                      item.status === "ACTIVE" ? "destructive" : "default"
                    }
                    onClick={() => setStatusToggle(item)}
                  >
                    {item.status === "ACTIVE" ? (
                      <>
                        <ToggleLeft className="mr-2 size-4" /> Deactivate
                      </>
                    ) : (
                      <>
                        <ToggleRight className="mr-2 size-4" /> Activate
                      </>
                    )}
                  </DropdownMenuItem>
                </PermissionGate>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      }
    )

    return base
  }, [
    config.allowsParent,
    config.hasRankLevel,
    config.requiresCustomerType,
    config.requiresLookupType,
    customerTypeNames,
    lookupTypeLabels,
    parentNames,
  ])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          placeholder={`Search ${lower}s...`}
          defaultValue={search}
          onChange={(v) => {
            setSearch(v)
            setPage(0)
          }}
        />
        {config.requiresLookupType ? (
          <Select
            items={[
              { value: "ALL", label: "All lookup types" },
              ...(lookupTypes ?? []).map((t) => ({
                value: t.code as string,
                label: t.label,
              })),
            ]}
            value={lookupType}
            onValueChange={(v: string | null) => {
              if (!v) return
              setLookupType(v as "ALL" | CustomerLookupType)
              setPage(0)
            }}
          >
            <SelectTrigger aria-label="Filter by lookup type" className="w-full sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="p-2">
              <SelectItem value="ALL">All lookup types</SelectItem>
              {(lookupTypes ?? []).map((t) => (
                <SelectItem key={t.code} value={t.code}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <StatusFilterSelect
          value={status}
          onChange={(v) => {
            setStatus(v)
            setPage(0)
          }}
        />
        <div className="ml-auto">
          <PermissionGate permission={PERMISSIONS.CUSTOMER.CREATE}>
            <Button
              onClick={() => {
                setEditing(null)
                setDialogOpen(true)
              }}
            >
              <Plus className="mr-2 size-4" /> Create {config.singular}
            </Button>
          </PermissionGate>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(r) => r.uuid}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        empty={{
          title: `No ${lower}s found`,
          description:
            search || status !== "ALL" || lookupType !== "ALL"
              ? "Try a different search or clear the filters."
              : `Create a ${lower} or load the defaults to get started.`,
        }}
        pagination={{
          page,
          totalPages,
          totalElements: data?.totalElements,
          onPageChange: setPage,
          pageSize: size,
          onPageSizeChange: (s) => {
            setSize(s)
            setPage(0)
          },
        }}
      />

      <CustomerMasterFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditing(null)
        }}
        companyUuid={companyUuid}
        config={config}
        master={editing}
      />

      <ConfirmDialog
        open={!!statusToggle}
        onOpenChange={(open) => !open && setStatusToggle(null)}
        title="Update status?"
        description={`This will change the ${lower} status.`}
        confirmLabel="Confirm"
        variant={
          statusToggle?.status === "ACTIVE" ? "destructive" : "default"
        }
        isLoading={statusMutation.isPending}
        onConfirm={() => {
          if (!statusToggle) return
          statusMutation.mutate(
            {
              uuid: statusToggle.uuid,
              status:
                statusToggle.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
              version: statusToggle.version,
            },
            {
              onSuccess: () => {
                toast.success("Status updated")
                setStatusToggle(null)
              },
              onError: (err) =>
                toast.error(getApiErrorMessage(err, "Failed to update status")),
            }
          )
        }}
      />
    </div>
  )
}
