"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Building2, Plus, MoreHorizontal, Eye, Pencil, ToggleLeft, ToggleRight } from "lucide-react"
import { Button } from "@/components/ui/button"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/common/StatusBadge"
import { PageHeader } from "@/components/common/PageHeader"
import { TableSkeleton } from "@/components/common/LoadingState"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { useCompanies } from "@/features/companies/hooks/use-companies"
import type { CompanyListParams } from "@/features/companies/api/company.types"
import { CompanyStatusDialog } from "@/features/companies/components/CompanyStatusDialog"

export default function CompaniesPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [statusTarget, setStatusTarget] = useState<{
    uuid: string
    name: string
    status: string
  } | null>(null)
  const size = 20

  const params: CompanyListParams = {
    search: search || undefined,
    page,
    size,
  }

  const { data, isLoading, error, refetch } = useCompanies(params)

  const companies = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

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

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No companies found"
          description={
            search
              ? "Try a different search term."
              : "Get started by creating a company."
          }
        >
          {!search && (
            <Button
              nativeButton={false}
              render={<Link href="/companies/new" />}
              className="mt-2"
            >
              <Plus className="mr-2 size-4" />
              Create Company
            </Button>
          )}
        </EmptyState>
      ) : (
        <>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>ERP</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.publicId}>
                    <TableCell className="font-mono text-sm">
                      {company.companyCode}
                    </TableCell>
                    <TableCell className="font-medium">
                      {company.companyName}
                    </TableCell>
                    <TableCell>{company.businessDomain}</TableCell>
                    <TableCell>{company.erpSystem}</TableCell>
                    <TableCell>
                      <StatusBadge status={company.status} />
                    </TableCell>
                    <TableCell>
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
