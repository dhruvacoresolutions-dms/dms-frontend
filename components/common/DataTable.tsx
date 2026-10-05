"use client"

import * as React from "react"
import {
  createSortedRowModel,
  flexRender,
  rowSortingFeature,
  sortFns,
  tableFeatures,
  useTable,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ChevronsUpDown, Loader2 } from "lucide-react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns,
})

export type DataTableFeatures = typeof dataTableFeatures

export interface DataTableCellContext<TData> {
  row: {
    original: TData
    index: number
  }
}

export interface DataTableColumn<TData> {
  id: string
  header?: React.ReactNode | (() => React.ReactNode)
  cell: (ctx: DataTableCellContext<TData>) => React.ReactNode
  /** Allow client-side sorting on this column (requires `enableSorting`). */
  enableSorting?: boolean
  /** Applied to both the header and body cells (e.g. `"w-12"` for actions). */
  className?: string
}

export interface DataTablePaginationConfig {
  /** 0-based page index (matches backend `page`). */
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  /** When provided, footer shows "Showing X–Y of Z". */
  totalElements?: number
  pageSize?: number
  /** When provided, footer shows a rows-per-page selector. */
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
}

export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100]

export interface DataTableEmptyConfig {
  icon?: React.ComponentType<{ className?: string }>
  title?: string
  description?: string
  action?: React.ReactNode
}

export interface DataTableProps<TData extends RowData> {
  columns: DataTableColumn<TData>[]
  data: TData[]
  /** Row id for React keys. Defaults to index-based. */
  getRowId?: (row: TData, index: number) => string
  isLoading?: boolean
  /** Skeleton row count while loading. Defaults to the pagination pageSize, else 5. */
  skeletonRows?: number
  /** Truthy when the query failed (e.g. the `error` from TanStack Query). */
  error?: unknown
  errorMessage?: string
  onRetry?: () => void
  empty?: DataTableEmptyConfig
  /** Fully custom empty content (overrides `empty`). */
  emptyContent?: React.ReactNode
  /** Server-side pagination. Omit for unpaginated tables. */
  pagination?: DataTablePaginationConfig
  onRowClick?: (row: TData) => void
  rowClassName?: string | ((row: TData) => string | undefined)
  wrapperClassName?: string
  /** Enable client-side sorting via clickable column headers. Off by default. */
  enableSorting?: boolean
}

function toTableColumns<TData extends RowData>(
  columns: DataTableColumn<TData>[]
): ColumnDef<DataTableFeatures, TData, unknown>[] {
  return columns.map((c) => ({
    id: c.id,
    header: typeof c.header === "function" ? () => c.header : () => c.header,
    cell: (ctx) =>
      c.cell({ row: { original: ctx.row.original, index: ctx.row.index } }),
    enableSorting: c.enableSorting ?? false,
    meta: c.className,
  }))
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  getRowId,
  isLoading = false,
  skeletonRows,
  error,
  errorMessage,
  onRetry,
  empty,
  emptyContent,
  pagination,
  onRowClick,
  rowClassName,
  wrapperClassName,
  enableSorting = false,
}: DataTableProps<TData>) {
  const tableColumns = React.useMemo(() => toTableColumns(columns), [columns])

  const table = useTable({
    features: dataTableFeatures,
    data,
    columns: tableColumns,
    ...(getRowId
      ? { getRowId: (originalRow: TData, index: number) => getRowId(originalRow, index) }
      : {}),
  })

  // Remember the last settled page metadata. On page change the query data
  // goes empty (totalPages drops to 0) while the new page loads — fall back
  // to the remembered values so the footer never unmounts mid-navigation.
  const [lastPageMeta, setLastPageMeta] = React.useState<{
    totalPages: number
    totalElements?: number
    pageSize?: number
  }>({ totalPages: 0 })
  if (
    !isLoading &&
    pagination &&
    pagination.totalPages > 0 &&
    (pagination.totalPages !== lastPageMeta.totalPages ||
      pagination.totalElements !== lastPageMeta.totalElements ||
      pagination.pageSize !== lastPageMeta.pageSize)
  ) {
    setLastPageMeta({
      totalPages: pagination.totalPages,
      totalElements: pagination.totalElements,
      pageSize: pagination.pageSize,
    })
  }

  if (error && !isLoading) {
    return <ErrorState message={errorMessage} onRetry={onRetry} />
  }

  const rowCount = table.getRowModel().rows.length
  // While (re)loading with no rows yet, render skeletons inside the table.
  // Page state updates instantly (parent useState), so the footer below
  // already reflects the target page while its rows load — optimistic UI.
  const showSkeleton = isLoading && rowCount === 0
  const resolvedSkeletonRows = skeletonRows ?? pagination?.pageSize ?? 5

  const effectivePagination =
    pagination &&
    showSkeleton &&
    pagination.totalPages <= 0 &&
    lastPageMeta.totalPages > 0
      ? { ...pagination, ...lastPageMeta }
      : pagination

  if (!showSkeleton && rowCount === 0) {
    if (emptyContent) return <>{emptyContent}</>
    return (
      <EmptyState
        icon={empty?.icon}
        title={empty?.title ?? "No results found"}
        description={empty?.description ?? "No items found."}
      >
        {empty?.action}
      </EmptyState>
    )
  }

  const pageSize = effectivePagination?.pageSize ?? data.length
  const from =
    effectivePagination?.totalElements != null
      ? effectivePagination.totalElements === 0
        ? 0
        : effectivePagination.page * pageSize + 1
      : null
  const to =
    effectivePagination?.totalElements != null
      ? Math.min(
          effectivePagination.page * pageSize + data.length,
          effectivePagination.totalElements
        )
      : null

  return (
    <div className="flex flex-col gap-4">
      <ScrollArea
        orientations={["vertical", "horizontal"]}
        className={cn("rounded-md border bg-background", wrapperClassName)}
        viewportClassName={cn(
          "max-h-[min(62svh,36rem)]",
          wrapperClassName
        )}
        // Track starts below the sticky header (h-10) so the floating
        // thumb only ever overlaps body rows, never the header.
        verticalScrollBarClassName="mt-10"
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={header.column.columnDef.meta as string | undefined}
                  >
                    {header.isPlaceholder ? null : enableSorting &&
                      header.column.getCanSort() ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="inline-flex cursor-pointer items-center gap-1 hover:text-foreground"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === "asc" ? (
                          <ArrowUp className="size-3.5" />
                        ) : header.column.getIsSorted() === "desc" ? (
                          <ArrowDown className="size-3.5" />
                        ) : (
                          <ChevronsUpDown className="size-3.5 opacity-50" />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {showSkeleton ? (
              Array.from({ length: resolvedSkeletonRows }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell colSpan={tableColumns.length}>
                    <Skeleton className="h-6" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              table.getRowModel().rows.map((row) => {
                const original = row.original
                const clickable = !!onRowClick
                const customClass =
                  typeof rowClassName === "function"
                    ? rowClassName(original)
                    : rowClassName
                return (
                  <TableRow
                    key={row.id}
                    className={cn(clickable && "cursor-pointer", customClass)}
                    onClick={clickable ? () => onRowClick?.(original) : undefined}
                  >
                    {row.getAllCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cell.column.columnDef.meta as string | undefined}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      {effectivePagination ? (
        <DataTablePagination
          page={effectivePagination.page}
          totalPages={effectivePagination.totalPages}
          onPageChange={effectivePagination.onPageChange}
          totalElements={effectivePagination.totalElements}
          from={from}
          to={to}
          isLoading={isLoading}
          pageSize={effectivePagination.pageSize}
          onPageSizeChange={effectivePagination.onPageSizeChange}
          pageSizeOptions={effectivePagination.pageSizeOptions}
        />
      ) : null}
    </div>
  )
}

export function DataTablePagination({
  page,
  totalPages,
  onPageChange,
  totalElements,
  from,
  to,
  isLoading = false,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  totalElements?: number
  from?: number | null
  to?: number | null
  isLoading?: boolean
  pageSize?: number
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
}) {
  const showRange = totalElements != null && from != null && to != null
  if (totalPages <= 1 && !showRange) return null
  // Nothing to be optimistic about on first load — footer appears once
  // at least one page of metadata exists.
  if (isLoading && totalPages <= 1) return null
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      <div className="flex flex-wrap items-center justify-start gap-4">
        {onPageSizeChange ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page</span>
            <Select
              value={String(pageSize ?? pageSizeOptions[0])}
              onValueChange={(v) => onPageSizeChange(Number(v))}
            >
              <SelectTrigger size="sm" className="h-8 min-w-20 gap-2 px-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="p-1.5">
                {pageSizeOptions.map((o) => (
                  <SelectItem key={o} value={String(o)}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>
      <p className="inline-flex items-center gap-2 text-center text-sm text-muted-foreground">
        {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : null}
        {showRange
          ? `Showing ${from}–${to} of ${totalElements}`
          : `Page ${page + 1} of ${totalPages}`}
        {showRange && totalPages > 1 ? ` · Page ${page + 1} of ${totalPages}` : null}
      </p>
      <div className="flex justify-end">
        {totalPages > 1 ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0 || isLoading}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1 || isLoading}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
