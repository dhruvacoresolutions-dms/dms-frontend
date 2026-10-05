"use client"

import { useAuthStore } from "@/stores/auth-store"
import { PageHeader } from "@/components/common/PageHeader"
import { RouteGate } from "@/components/auth/RouteGate"
import { ProductForm } from "@/features/products/components/ProductForm"
import { PERMISSIONS } from "@/lib/permissions"

export default function NewProductPage() {
  return (
    <RouteGate permission={PERMISSIONS.PRODUCT.CREATE}>
      <NewProductContent />
    </RouteGate>
  )
}

function NewProductContent() {
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Create Product"
        description="Add a new product to the catalogue"
      />
      <ProductForm companyUuid={companyUuid} />
    </div>
  )
}
