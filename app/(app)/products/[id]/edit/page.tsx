"use client"

import { use } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { PageHeader } from "@/components/common/PageHeader"
import { RouteGate } from "@/components/auth/RouteGate"
import { ProductForm } from "@/features/products/components/ProductForm"
import { PERMISSIONS } from "@/lib/permissions"

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <RouteGate permission={PERMISSIONS.PRODUCT.UPDATE}>
      <EditProductContent params={params} />
    </RouteGate>
  )
}

function EditProductContent({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader title="Edit Product" description="Update product details" />
      <ProductForm companyUuid={companyUuid} productUuid={id} />
    </div>
  )
}
