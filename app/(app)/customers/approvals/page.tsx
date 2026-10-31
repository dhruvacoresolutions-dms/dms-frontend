"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  Eye,
  Info,
  Landmark,
  MoreHorizontal,
  ShieldCheck,
} from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
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
import { RouteGate } from "@/components/auth/RouteGate"
import { usePermission } from "@/hooks/use-permission"
import { formatDateTime } from "@/lib/format"
import { PERMISSIONS } from "@/lib/permissions"
import { usePendingCustomerApprovals } from "@/features/customers/hooks/use-pending-customer-approvals"
import {
  CustomerLifecycleDialog,
  lifecycleActionsFor,
} from "@/features/customers/components/CustomerLifecycleDialog"
import type {
  CustomerLifecycleAction,
  CustomerResponse,
} from "@/features/customers/api/customer.types"

export default function CustomerApprovalsPage() {
  return (
    <RouteGate permission={PERMISSIONS.CUSTOMER.APPROVE}>
      <CustomerApprovalsContent />
    </RouteGate>
  )
}

function CustomerApprovalsContent() {
  const router = useRouter()
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const currentUserUuid = useAuthStore((s) => s.session?.user?.userUuid)
  const { has } = usePermission()

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [target, setTarget] = useState<{
    customer: CustomerResponse
    action: CustomerLifecycleAction
  } | null>(null)

  const { data, isLoading, error, refetch } = usePendingCustomerApprovals(
    companyUuid,
    { q: search || undefined, page, size }
  )

  const rows = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

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
              {!territoryUuid ? (
                <span className="text-[11px] text-muted-foreground">
                  Approve will ask for a territory
                </span>
              ) : null}
            </div>
          )
        },
      },
      {
        id: "readiness",
        header: "Approval readiness",
        cell: ({ row }) => {
          const { kycBankComplete, kycCount, hasBank } = row.original
          return (
            <div className="flex flex-col items-start gap-1">
              {kycBankComplete ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="size-3.5" aria-hidden="true" />
                  Ready to approve
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="size-3.5" aria-hidden="true" />
                  Verification incomplete
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Landmark className="size-3" aria-hidden="true" />
                {kycCount} KYC · {hasBank ? "bank on file" : "no bank"}
              </span>
            </div>
          )
        },
      },
      {
        id: "submitted",
        header: "Created",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {formatDateTime(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const c = row.original
          const transitions = lifecycleActionsFor(c.lifecycleStatus).filter(
            (t) => has(t.permission)
          )
          const isCreator =
            !!currentUserUuid && c.createdBy === currentUserUuid
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
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/customers/${c.uuid}`)
                  }}
                >
                  <Eye className="mr-2 size-4" /> View details
                </DropdownMenuItem>
                {transitions.length > 0 ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      Review
                    </DropdownMenuLabel>
                    {transitions.map((t) => {
                      const blocked =
                        isCreator &&
                        (t.action === "approve" ||
                          t.action === "reject" ||
                          t.action === "rework")
                      return (
                        <DropdownMenuItem
                          key={t.action}
                          variant={t.destructive ? "destructive" : "default"}
                          disabled={blocked}
                          title={
                            blocked
                              ? "You cannot review a customer you created."
                              : undefined
                          }
                          onClick={(e) => {
                            e.stopPropagation()
                            if (blocked) return
                            setTarget({ customer: c, action: t.action })
                          }}
                        >
                          <t.icon className="mr-2 size-4" />
                          {t.label}
                        </DropdownMenuItem>
                      )
                    })}
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [router, has, currentUserUuid]
  )

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        backHref="/customers"
        title="Customer Approvals"
        description={
          data
            ? `${data.totalElements.toLocaleString()} submitted customer${
                data.totalElements === 1 ? "" : "s"
              } waiting for your approval.`
            : "Submitted customers waiting for your approval."
        }
      />

      <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>
          Approval requires one verified KYC entry, no pending KYC entries and a
          verified bank account. You cannot review a customer you created
          yourself.
        </p>
      </div>

      <SearchInput
        className="max-w-xs flex-none"
        placeholder="Search shop, code, mobile, GSTIN..."
        defaultValue={search}
        onChange={(v) => {
          setSearch(v)
          setPage(0)
        }}
      />

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(c) => c.uuid}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        empty={{
          icon: ShieldCheck,
          title: search
            ? "No matching customers"
            : "Nothing to approve",
          description: search
            ? "Try a different search."
            : "Submitted customers from your team will appear here.",
          action: search ? (
            <Button
              variant="outline"
              onClick={() => {
                setSearch("")
                setPage(0)
              }}
            >
              Clear search
            </Button>
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

      <CustomerLifecycleDialog
        key={`${target?.customer.uuid ?? "none"}-${target?.action ?? "none"}`}
        open={!!target}
        onOpenChange={(open) => {
          if (!open) setTarget(null)
        }}
        companyUuid={companyUuid}
        customer={
          target
            ? {
                uuid: target.customer.uuid,
                lifecycleStatus: target.customer.lifecycleStatus,
                source: target.customer.source,
                version: target.customer.version,
                territoryUuid: target.customer.territoryUuid,
                kycBankComplete: target.customer.kycBankComplete,
              }
            : null
        }
        action={target?.action ?? null}
        onSuccess={() => {
          setTarget(null)
          // The approved row left the queue — keep the page in range.
          if (rows.length === 1 && page > 0) setPage(page - 1)
        }}
      />
    </div>
  )
}
