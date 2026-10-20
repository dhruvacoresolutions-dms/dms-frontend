"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Eye,
  Landmark,
  MoreHorizontal,
  Pencil,
  Plus,
  ShieldCheck,
  UsersRound,
  Wallet,
} from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SearchInput } from "@/components/common/SearchInput"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { StatusBadge } from "@/components/common/StatusBadge"
import { PageHeader } from "@/components/common/PageHeader"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { RouteGate } from "@/components/auth/RouteGate"
import { PERMISSIONS } from "@/lib/permissions"
import { useCustomers } from "@/features/customers/hooks/use-customers"
import { useCustomerLifecycleCounts } from "@/features/customers/hooks/use-customer-lifecycle-counts"
import { CustomerTypeCombobox } from "@/features/customers/components/CustomerTypeCombobox"
import { CustomerFormDialog } from "@/features/customers/components/CustomerFormDialog"
import { CustomerKpiCards } from "@/features/customers/components/CustomerKpiCards"
import {
  CustomerLifecycleDialog,
  lifecycleActionsFor,
} from "@/features/customers/components/CustomerLifecycleDialog"
import type {
  CustomerGeographyStatus,
  CustomerLifecycleAction,
  CustomerLifecycleStatus,
  CustomerResponse,
  CustomerSource,
} from "@/features/customers/api/customer.types"

const LIFECYCLE_OPTIONS: {
  value: "ALL" | CustomerLifecycleStatus
  label: string
}[] = [
  { value: "ALL", label: "All lifecycle states" },
  { value: "DRAFT", label: "Draft" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "VERIFIED", label: "Verified" },
  { value: "ACTIVE", label: "Active" },
  { value: "REWORK", label: "Rework" },
  { value: "REJECTED", label: "Rejected" },
  { value: "INACTIVE", label: "Inactive" },
]

const GEOGRAPHY_OPTIONS: {
  value: "ALL" | CustomerGeographyStatus
  label: string
}[] = [
  { value: "ALL", label: "Any geography" },
  { value: "MAPPED", label: "Mapped" },
  { value: "MANUAL", label: "Manual" },
  { value: "MAPPING_PENDING", label: "Mapping pending" },
  { value: "REVIEW", label: "Needs review" },
]

const SOURCE_OPTIONS: { value: "ALL" | CustomerSource; label: string }[] = [
  { value: "ALL", label: "Any source" },
  { value: "ADMIN", label: "Admin" },
  { value: "EMPLOYEE", label: "Field employee" },
  { value: "DISTRIBUTOR", label: "Distributor" },
  { value: "SELF_REGISTRATION", label: "Self registration" },
]

const TERRITORY_OPTIONS = [
  { value: "ALL", label: "Territory: any" },
  { value: "ASSIGNED", label: "Territory assigned" },
  { value: "UNASSIGNED", label: "Territory unassigned" },
] as const

type TerritoryFilter = (typeof TERRITORY_OPTIONS)[number]["value"]

export default function CustomersPage() {
  return (
    <RouteGate permission={PERMISSIONS.CUSTOMER.VIEW}>
      <CustomersContent />
    </RouteGate>
  )
}

function CustomersContent() {
  const router = useRouter()
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"

  const [search, setSearch] = useState("")
  const [lifecycle, setLifecycle] = useState<"ALL" | CustomerLifecycleStatus>(
    "ALL"
  )
  const [typeUuid, setTypeUuid] = useState<string | null>(null)
  const [geography, setGeography] = useState<"ALL" | CustomerGeographyStatus>(
    "ALL"
  )
  const [source, setSource] = useState<"ALL" | CustomerSource>("ALL")
  const [territory, setTerritory] = useState<TerritoryFilter>("ALL")
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingUuid, setEditingUuid] = useState<string | null>(null)
  const [lifecycleTarget, setLifecycleTarget] = useState<{
    customer: CustomerResponse
    action: CustomerLifecycleAction
  } | null>(null)

  const { data, isLoading, error, refetch } = useCustomers(companyUuid, {
    q: search || undefined,
    lifecycleStatus: lifecycle === "ALL" ? undefined : lifecycle,
    customerType: typeUuid ?? undefined,
    geographyStatus: geography === "ALL" ? undefined : geography,
    source: source === "ALL" ? undefined : source,
    territoryAssigned:
      territory === "ALL" ? undefined : territory === "ASSIGNED",
    sort: "createdAt,desc",
    page,
    size,
  })

  const { counts, isLoading: countsLoading } =
    useCustomerLifecycleCounts(companyUuid)

  const customers = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const hasActiveFilters =
    search !== "" ||
    lifecycle !== "ALL" ||
    typeUuid !== null ||
    geography !== "ALL" ||
    source !== "ALL" ||
    territory !== "ALL"

  const resetFilters = () => {
    setSearch("")
    setLifecycle("ALL")
    setTypeUuid(null)
    setGeography("ALL")
    setSource("ALL")
    setTerritory("ALL")
    setPage(0)
  }

  const columns = useMemo<DataTableColumn<CustomerResponse>[]>(
    () => [
      {
        id: "customer",
        header: "Customer",
        cell: ({ row }) => {
          const c = row.original
          return (
            <div className="min-w-0">
              <Link
                href={`/customers/${c.uuid}`}
                className="font-medium underline-offset-4 hover:underline"
              >
                {c.shopName}
              </Link>
              <p className="font-mono text-xs text-muted-foreground">
                {c.customerCode}
              </p>
            </div>
          )
        },
      },
      {
        id: "contact",
        header: "Contact",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate">{row.original.contactPerson}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {row.original.mobile}
            </p>
          </div>
        ),
      },
      {
        id: "type",
        header: "Type",
        cell: ({ row }) =>
          row.original.displayNames?.customerType ?? (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "territory",
        header: "Territory",
        cell: ({ row }) => {
          const { displayNames, territoryUuid, geographyStatus } = row.original
          return (
            <div className="flex flex-col items-start gap-1">
              <span className="text-sm">
                {displayNames?.territory ?? (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </span>
              <StatusBadge status={geographyStatus} className="text-[11px]" />
              {!territoryUuid && geographyStatus === "MANUAL" ? (
                <span className="text-[11px] text-muted-foreground">
                  Manual entry
                </span>
              ) : null}
            </div>
          )
        },
      },
      {
        id: "lifecycle",
        header: "Lifecycle",
        cell: ({ row }) => (
          <StatusBadge status={row.original.lifecycleStatus} />
        ),
      },
      {
        id: "readiness",
        header: "Setup",
        cell: ({ row }) => {
          const { hasBank, hasCredit, kycCount } = row.original
          return (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span
                title={hasBank ? "Bank account on file" : "No bank account"}
                className={
                  hasBank ? "text-emerald-600 dark:text-emerald-400" : ""
                }
              >
                <Landmark className="size-4" aria-label="Bank account" />
              </span>
              <span
                title={hasCredit ? "Credit terms on file" : "No credit terms"}
                className={
                  hasCredit ? "text-emerald-600 dark:text-emerald-400" : ""
                }
              >
                <Wallet className="size-4" aria-label="Credit terms" />
              </span>
              <span
                title={`${kycCount} KYC document${kycCount === 1 ? "" : "s"}`}
                className={
                  kycCount > 0
                    ? "inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400"
                    : "inline-flex items-center gap-1"
                }
              >
                <ShieldCheck className="size-4" aria-label="KYC documents" />
                <span className="text-xs tabular-nums">{kycCount}</span>
              </span>
            </div>
          )
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const c = row.original
          const editable =
            c.lifecycleStatus === "DRAFT" || c.lifecycleStatus === "REWORK"
          const transitions = lifecycleActionsFor(c.lifecycleStatus)
          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="cursor-pointer"
                aria-label="Row actions"
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto min-w-48">
                <DropdownMenuItem
                  onClick={() => router.push(`/customers/${c.uuid}`)}
                >
                  <Eye className="mr-2 size-4" /> View details
                </DropdownMenuItem>
                <PermissionGate permission={PERMISSIONS.CUSTOMER.UPDATE}>
                  <DropdownMenuItem
                    disabled={!editable}
                    onClick={() => setEditingUuid(c.uuid)}
                  >
                    <Pencil className="mr-2 size-4" /> Edit
                  </DropdownMenuItem>
                </PermissionGate>
                {transitions.length > 0 ? (
                  <PermissionGate permission={PERMISSIONS.CUSTOMER.MANAGE}>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      Lifecycle
                    </DropdownMenuLabel>
                    {transitions.map((t) => (
                      <DropdownMenuItem
                        key={t.action}
                        variant={t.destructive ? "destructive" : "default"}
                        onClick={() =>
                          setLifecycleTarget({
                            customer: c,
                            action: t.action,
                          })
                        }
                      >
                        <t.icon className="mr-2 size-4" />
                        {t.label}
                      </DropdownMenuItem>
                    ))}
                  </PermissionGate>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [router]
  )

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Customers"
        description="Retailers and mechanics with their lifecycle, territory and KYC readiness."
        action={
          <PermissionGate permission={PERMISSIONS.CUSTOMER.CREATE}>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 size-4" /> Create Customer
            </Button>
          </PermissionGate>
        }
      />

      <CustomerKpiCards
        counts={counts}
        isLoading={countsLoading}
        activeKey={lifecycle}
        onSelect={(key) => {
          setLifecycle(key)
          setPage(0)
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          placeholder="Search shop, code, mobile, GSTIN..."
          defaultValue={search}
          onChange={(v) => {
            setSearch(v)
            setPage(0)
          }}
        />
        <FilterSelect
          value={lifecycle}
          onChange={(v) => {
            setLifecycle(v as "ALL" | CustomerLifecycleStatus)
            setPage(0)
          }}
          options={LIFECYCLE_OPTIONS}
          ariaLabel="Filter by lifecycle status"
        />
        <div className="w-52">
          <CustomerTypeCombobox
            companyUuid={companyUuid}
            value={typeUuid}
            onValueChange={(v) => {
              setTypeUuid(v)
              setPage(0)
            }}
            placeholder="All customer types"
          />
        </div>
        <FilterSelect
          value={geography}
          onChange={(v) => {
            setGeography(v as "ALL" | CustomerGeographyStatus)
            setPage(0)
          }}
          options={GEOGRAPHY_OPTIONS}
          ariaLabel="Filter by geography status"
        />
        <FilterSelect
          value={source}
          onChange={(v) => {
            setSource(v as "ALL" | CustomerSource)
            setPage(0)
          }}
          options={SOURCE_OPTIONS}
          ariaLabel="Filter by source"
        />
        <FilterSelect
          value={territory}
          onChange={(v) => {
            setTerritory(v as TerritoryFilter)
            setPage(0)
          }}
          options={[...TERRITORY_OPTIONS]}
          ariaLabel="Filter by territory assignment"
        />
        {hasActiveFilters ? (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Clear filters
          </Button>
        ) : null}
      </div>

      <DataTable
        columns={columns}
        data={customers}
        getRowId={(c) => c.uuid}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        empty={{
          icon: UsersRound,
          title: "No customers found",
          description: hasActiveFilters
            ? "Try a different search or clear the filters."
            : "Create your first customer to get started.",
          action: !hasActiveFilters ? (
            <PermissionGate permission={PERMISSIONS.CUSTOMER.CREATE}>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 size-4" /> Create Customer
              </Button>
            </PermissionGate>
          ) : undefined,
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

      <CustomerFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyUuid={companyUuid}
      />
      <CustomerFormDialog
        open={!!editingUuid}
        onOpenChange={(open) => !open && setEditingUuid(null)}
        companyUuid={companyUuid}
        customerUuid={editingUuid}
      />

      <CustomerLifecycleDialog
        open={!!lifecycleTarget}
        onOpenChange={(open) => {
          if (!open) setLifecycleTarget(null)
        }}
        companyUuid={companyUuid}
        customer={
          lifecycleTarget
            ? {
                uuid: lifecycleTarget.customer.uuid,
                lifecycleStatus: lifecycleTarget.customer.lifecycleStatus,
                source: lifecycleTarget.customer.source,
                version: lifecycleTarget.customer.version,
              }
            : null
        }
        action={lifecycleTarget?.action ?? null}
        onSuccess={() => setLifecycleTarget(null)}
      />
    </div>
  )
}

function FilterSelect({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string
  onChange: (value: string) => void
  options: readonly { value: string; label: string }[]
  ariaLabel: string
}) {
  return (
    <Select
      items={options}
      value={value}
      onValueChange={(v: string | null) => v && onChange(v)}
    >
      <SelectTrigger aria-label={ariaLabel} className="w-full sm:w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="p-2">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
