"use client"

import { use, useState } from "react"
import Link from "next/link"
import { useAuthStore } from "@/stores/auth-store"
import {
  Pencil,
  Rocket,
  Ban,
  RotateCcw,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/common/PageHeader"
import { LoadingState } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { RouteGate } from "@/components/auth/RouteGate"
import { PERMISSIONS } from "@/lib/permissions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useProduct } from "@/features/products/hooks/use-product"
import {
  usePublishProduct,
  useDeactivateProduct,
  useReactivateProduct,
} from "@/features/products/hooks/use-product-mutations"
import { ProductImportDialog } from "@/features/products/components/ProductImportDialog"
import { ProductOverviewTab } from "@/features/products/components/product-detail/ProductOverviewTab"
import { ProductPricesSection } from "@/features/products/components/product-detail/ProductPricesSection"
import { ProductBatchesSection } from "@/features/products/components/product-detail/ProductBatchesSection"
import { ProductMappingsSection } from "@/features/products/components/product-detail/ProductMappingsSection"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <RouteGate permission={PERMISSIONS.PRODUCT.VIEW}>
      <ProductDetailContent params={params} />
    </RouteGate>
  )
}

function ProductDetailContent({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"

  const { data: product, isLoading, error, refetch } = useProduct(
    companyUuid,
    id
  )
  const [lifecycle, setLifecycle] = useState<
    "publish" | "deactivate" | "reactivate" | null
  >(null)
  const [priceImportOpen, setPriceImportOpen] = useState(false)

  const publishMutation = usePublishProduct(companyUuid)
  const deactivateMutation = useDeactivateProduct(companyUuid)
  const reactivateMutation = useReactivateProduct(companyUuid)
  const lifecyclePending =
    publishMutation.isPending ||
    deactivateMutation.isPending ||
    reactivateMutation.isPending

  if (isLoading) return <LoadingState message="Loading product..." />
  if (error || !product) return <ErrorState onRetry={refetch} />

  const handleLifecycleConfirm = () => {
    if (!lifecycle) return
    const input = { version: product.version }
    const mutate =
      lifecycle === "publish"
        ? publishMutation
        : lifecycle === "deactivate"
          ? deactivateMutation
          : reactivateMutation
    mutate.mutate(
      { productUuid: id, input },
      {
        onSuccess: () => {
          toast.success(`Product ${lifecycle}d`)
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
        title={product.name}
        description={`${product.code} · v${product.version}`}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/products" />}
            >
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Button>
            <PermissionGate permission={PERMISSIONS.PRODUCT.UPDATE}>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href={`/products/${id}/edit`} />}
              >
                <Pencil className="mr-2 size-4" />
                Edit
              </Button>
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.PRODUCT.UPDATE}>
              {product.status === "DRAFT" && (
                <Button onClick={() => setLifecycle("publish")}>
                  <Rocket className="mr-2 size-4" />
                  Publish
                </Button>
              )}
              {product.status === "ACTIVE" && (
                <Button
                  variant="destructive"
                  onClick={() => setLifecycle("deactivate")}
                >
                  <Ban className="mr-2 size-4" />
                  Deactivate
                </Button>
              )}
              {product.status === "INACTIVE" && (
                <Button onClick={() => setLifecycle("reactivate")}>
                  <RotateCcw className="mr-2 size-4" />
                  Reactivate
                </Button>
              )}
            </PermissionGate>
          </div>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="prices">Prices</TabsTrigger>
          <TabsTrigger value="batches">Batches</TabsTrigger>
          <TabsTrigger value="mappings">Mappings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ProductOverviewTab product={product} />
        </TabsContent>

        <TabsContent value="prices">
          <ProductPricesSection
            companyUuid={companyUuid}
            productUuid={id}
            onImport={() => setPriceImportOpen(true)}
          />
        </TabsContent>

        <TabsContent value="batches">
          <ProductBatchesSection companyUuid={companyUuid} productUuid={id} />
        </TabsContent>

        <TabsContent value="mappings">
          <ProductMappingsSection companyUuid={companyUuid} productUuid={id} />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={!!lifecycle}
        onOpenChange={(open) => !open && setLifecycle(null)}
        title={
          lifecycle === "publish"
            ? "Publish Product?"
            : lifecycle === "deactivate"
              ? "Deactivate Product?"
              : "Reactivate Product?"
        }
        description="This will change the product lifecycle state."
        confirmLabel="Confirm"
        isLoading={lifecyclePending}
        onConfirm={handleLifecycleConfirm}
      />

      <ProductImportDialog
        open={priceImportOpen}
        onOpenChange={setPriceImportOpen}
        companyUuid={companyUuid}
        kind="prices"
      />
    </div>
  )
}
