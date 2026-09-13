"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/common/SearchInput"
import { PageHeader } from "@/components/common/PageHeader"
import { TableSkeleton } from "@/components/common/LoadingState"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { useDepartments } from "@/features/departments/hooks/use-departments"
import { DepartmentTable } from "@/features/departments/components/DepartmentTable"
import { DepartmentFormDialog } from "@/features/departments/components/DepartmentFormDialog"
import { DEPARTMENT_PAGE_SIZE, DEPARTMENT_TEXTS } from "@/features/departments/configs/department.config"

export default function DepartmentsPage() {
  const params = useParams<{ companyUuid: string }>()
  const companyUuid = params.companyUuid
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingUuid, setEditingUuid] = useState<string | null>(null)

  const { data, isLoading, error, refetch } = useDepartments(companyUuid, {
    query: search || undefined,
    page,
    size: DEPARTMENT_PAGE_SIZE,
  })

  const departments = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title={DEPARTMENT_TEXTS.title}
        description={DEPARTMENT_TEXTS.description}
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 size-4" /> Create Department
          </Button>
        }
      />

      <div className="flex items-center gap-2">
        <SearchInput
          placeholder={DEPARTMENT_TEXTS.searchPlaceholder}
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
      ) : departments.length === 0 ? (
        <EmptyState
          title={DEPARTMENT_TEXTS.emptyTitle}
          description={
            search ? DEPARTMENT_TEXTS.emptySearchHint : DEPARTMENT_TEXTS.emptyCreateHint
          }
        />
      ) : (
        <DepartmentTable
          departments={departments}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onEdit={(d) => setEditingUuid(d.departmentUuid)}
        />
      )}

      <DepartmentFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyUuid={companyUuid}
      />
      <DepartmentFormDialog
        open={!!editingUuid}
        onOpenChange={(open) => !open && setEditingUuid(null)}
        companyUuid={companyUuid}
        departmentUuid={editingUuid}
      />
    </div>
  )
}
