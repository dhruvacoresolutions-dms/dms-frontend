"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Building2, Plus, MoreHorizontal, Eye, Pencil, ToggleLeft, ToggleRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/common/SearchInput"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/common/StatusBadge"
import { PageHeader } from "@/components/common/PageHeader"
import { useCompanies } from "@/features/companies/hooks/use-companies"
import type { CompanyListParams, CompanySummaryResponse } from "@/features/companies/api/company.types"
import { CompanyStatusDialog } from "@/features/companies/components/CompanyStatusDialog"

export default function CompaniesPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [statusTarget, setStatusTarget] = useState<{
    uuid: string
    name: string
    status: string
  } | null>(null)

  const params: CompanyListParams = {
    search: search || undefined,
    page,
    size,
  }

  const { data, isLoading, error, refetch } = useCompanies(params)

  const companies = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  const columns = useMemo<DataTableColumn<CompanySummaryResponse>[]>(
    () => [
      {
        id: "code",
        header: "Code",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.companyCode}</span>
        ),
      },
      {
        id: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.companyName}</span>
        ),
      },
      {
        id: "domain",
        header: "Domain",
        cell: ({ row }) => row.original.businessDomain,
      },
      {
        id: "erp",
        header: "ERP",
        cell: ({ row }) => row.original.erpSystem,
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
          const company = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer">
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-auto min-w-40"
              >
                <DropdownMenuItem
                  onClick={() => {
                    router.push(`/companies/${company.publicId}`)
                  }}
                >
                  <Eye className="mr-2 size-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    router.push(`/companies/${company.publicId}/edit`)
                  }}
                >
                  <Pencil className="mr-2 size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant={
                    company.status === "ACTIVE"
                      ? "destructive"
                      : "default"
                  }
                  onClick={() => {
                    setStatusTarget({
                      uuid: company.publicId,
                      name: company.companyName,
                      status: company.status,
                    })
                  }}
                >
                  {company.status === "ACTIVE" ? (
                    <>
                      <ToggleLeft className="mr-2 size-4" />{" "}
                      Deactivate
                    </>
                  ) : (
                    <>
                      <ToggleRight className="mr-2 size-4" /> Activate
                    </>
                  )}
                </DropdownMenuItem>
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
        title="Companies"
        description="Manage your companies"
        action={
          <Button nativeButton={false} render={<Link href="/companies/new" />}>
            <Plus className="mr-2 size-4" />
            Create Company
          </Button>
        }
      />

      <div className="flex items-center gap-2">
        <SearchInput
          placeholder="Search companies..."
          defaultValue={search}
          onChange={(v) => {
            setSearch(v)
            setPage(0)
          }}
        />
      </div>

      <DataTable
        columns={columns}
        data={companies}
        getRowId={(company) => company.publicId}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        empty={{
          icon: Building2,
          title: "No companies found",
          description: search
            ? "Try a different search term."
            : "Get started by creating a company.",
          action: !search ? (
            <Button nativeButton={false} render={<Link href="/companies/new" />}>
              <Plus className="mr-2 size-4" />
              Create Company
            </Button>
          ) : undefined,
        }}
        pagination={{ page, totalPages, onPageChange: setPage, pageSize: size, onPageSizeChange: (s) => { setSize(s); setPage(0) } }}
      />

      <CompanyStatusDialog
        open={!!statusTarget}
        onOpenChange={(open) => !open && setStatusTarget(null)}
        companyUuid={statusTarget?.uuid ?? null}
        companyName={statusTarget?.name}
        currentStatus={statusTarget?.status}
      />
    </div>
  )
}
