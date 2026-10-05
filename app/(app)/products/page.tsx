"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import {
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Upload,
  Rocket,
  Ban,
  RotateCcw,
} from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/common/PageHeader"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { RouteGate } from "@/components/auth/RouteGate"
import { ExportDropdown } from "@/components/common/ExportDropdown"
import { StatusBadge } from "@/components/common/StatusBadge"
import { useProducts } from "@/features/products/hooks/use-products"
import {
  usePublishProduct,
  useDeactivateProduct,
  useReactivateProduct,
} from "@/features/products/hooks/use-product-mutations"
import { exportProducts } from "@/features/products/api/product.api"
import { ProductImportDialog } from "@/features/products/components/ProductImportDialog"
import { PERMISSIONS } from "@/lib/permissions"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"
import type { ProductResponse } from "@/features/products/api/product.types"

export default function ProductsPage() {
  return (
    <RouteGate permission={PERMISSIONS.PRODUCT.VIEW}>
      <ProductsContent />
    </RouteGate>
  )
}

type LifecycleAction = {
  kind: "publish" | "deactivate" | "reactivate"
  product: ProductResponse
}

function ProductsContent() {
  const router = useRouter()
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [importOpen, setImportOpen] = useState(false)
  const [lifecycle, setLifecycle] = useState<LifecycleAction | null>(null)

  const { data, isLoading, error, refetch } = useProducts(companyUuid, {
    search: search || undefined,
    page,
    size,
  })

  const publishMutation = usePublishProduct(companyUuid)
  const deactivateMutation = useDeactivateProduct(companyUuid)
  const reactivateMutation = useReactivateProduct(companyUuid)

  const products = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const lifecyclePending =
    publishMutation.isPending ||
    deactivateMutation.isPending ||
    reactivateMutation.isPending

  const columns = useMemo<DataTableColumn<ProductResponse>[]>(
    () => [
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
      {
        id: "category",
        header: "Category",
        cell: ({ row }) => row.original.category?.name ?? "—",
      },
      {
        id: "type",
        header: "Type",
        cell: ({ row }) =>
          row.original.productType ? (
            <Badge variant="secondary">{row.original.productType}</Badge>
          ) : (
            "—"
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
          const p = row.original
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
                  onClick={() =>
                    router.push(`/products/${p.productUuid}`)
                  }
                >
                  <Eye className="mr-2 size-4" />
                  View
                </DropdownMenuItem>
                <PermissionGate
                  permission={PERMISSIONS.PRODUCT.UPDATE}
                >
                  <DropdownMenuItem
                    onClick={() =>
                      router.push(`/products/${p.productUuid}/edit`)
                    }
                  >
                    <Pencil className="mr-2 size-4" />
                    Edit
                  </DropdownMenuItem>
                </PermissionGate>
                <PermissionGate
                  permission={PERMISSIONS.PRODUCT.UPDATE}
                >
                  <DropdownMenuSeparator />
                  {p.status === "DRAFT" && (
                    <DropdownMenuItem
                      onClick={() =>
                        setLifecycle({ kind: "publish", product: p })
                      }
                    >
                      <Rocket className="mr-2 size-4" />
                      Publish
                    </DropdownMenuItem>
                  )}
                  {p.status === "ACTIVE" && (
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() =>
                        setLifecycle({
                          kind: "deactivate",
                          product: p,
                        })
                      }
                    >
                      <Ban className="mr-2 size-4" />
                      Deactivate
                    </DropdownMenuItem>
                  )}
                  {p.status === "INACTIVE" && (
                    <DropdownMenuItem
                      onClick={() =>
                        setLifecycle({
                          kind: "reactivate",
                          product: p,
                        })
                      }
                    >
                      <RotateCcw className="mr-2 size-4" />
                      Reactivate
                    </DropdownMenuItem>
                  )}
                </PermissionGate>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [router]
  )

  const handleLifecycleConfirm = () => {
    if (!lifecycle) return
    const { kind, product } = lifecycle
    const input = { version: product.version }
    const mutate =
      kind === "publish"
        ? publishMutation
        : kind === "deactivate"
          ? deactivateMutation
          : reactivateMutation
    mutate.mutate(
      { productUuid: product.productUuid, input },
      {
        onSuccess: () => {
          toast.success(
            kind === "publish"
              ? "Product published"
              : kind === "deactivate"
                ? "Product deactivated"
                : "Product reactivated"
          )
          setLifecycle(null)
        },
        onError: (err) =>
          toast.error(getApiErrorMessage(err, "Action failed")),
      }
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Products"
        description="Manage product catalogue and pricing"
        action={
          <div className="flex items-center gap-2">
            <PermissionGate permission={PERMISSIONS.PRODUCT.IMPORT}>
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <Upload className="mr-2 size-4" />
                Import
              </Button>
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.PRODUCT.CREATE}>
              <Button nativeButton={false} render={<Link href="/products/new" />}>
                <Plus className="mr-2 size-4" />
                Create Product
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <div className="flex items-center gap-2">
        <SearchInput
          placeholder="Search products..."
          defaultValue={search}
          onChange={(v) => {
            setSearch(v)
            setPage(0)
          }}
        />
        <div className="ml-auto flex items-center gap-2">
          <ExportDropdown
            permission={PERMISSIONS.PRODUCT.EXPORT}
            baseFileName="products-export"
            onExport={(format) =>
              exportProducts(companyUuid, format, {
                search: search || undefined,
              })
            }
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={products}
        getRowId={(p) => p.productUuid}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        empty={{
          icon: Plus,
          title: "No products found",
          description: search
            ? "Try a different search term."
            : "Get started by creating a product.",
          action: !search ? (
            <PermissionGate permission={PERMISSIONS.PRODUCT.CREATE}>
              <Button nativeButton={false} render={<Link href="/products/new" />}>
                <Plus className="mr-2 size-4" />
                Create Product
              </Button>
            </PermissionGate>
          ) : undefined,
        }}
        pagination={{ page, totalPages, onPageChange: setPage, pageSize: size, onPageSizeChange: (s) => { setSize(s); setPage(0) } }}
      />

      <ConfirmDialog
        open={!!lifecycle}
        onOpenChange={(open) => !open && setLifecycle(null)}
        title={
          lifecycle?.kind === "publish"
            ? "Publish Product?"
            : lifecycle?.kind === "deactivate"
              ? "Deactivate Product?"
              : "Reactivate Product?"
        }
        description={
          lifecycle?.kind === "publish"
            ? "The product will become available for transactions."
            : lifecycle?.kind === "deactivate"
              ? "The product will no longer be available for new transactions."
              : "The product will become available again."
        }
        confirmLabel="Confirm"
        isLoading={lifecyclePending}
        onConfirm={handleLifecycleConfirm}
      />

      <ProductImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        companyUuid={companyUuid}
        kind="products"
        onUploadComplete={() => refetch()}
      />
    </div>
  )
}
