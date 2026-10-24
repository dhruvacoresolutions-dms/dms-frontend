"use client"

import { use } from "react"
import { RouteGate } from "@/components/auth/RouteGate"
import { useAuthStore } from "@/stores/auth-store"
import { CustomerFormWizard } from "@/features/customers/components/CustomerFormWizard"
import { PageHeader } from "@/components/common/PageHeader"
import { PERMISSIONS } from "@/lib/permissions"

export default function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <RouteGate permission={PERMISSIONS.CUSTOMER.UPDATE}>
      <EditCustomerContent params={params} />
    </RouteGate>
  )
}

function EditCustomerContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const companyUuid =
    useAuthStore((state) => state.session?.user?.companyUuid) ?? "current"
  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        backHref={`/customers/${id}`}
        backLabel="Customer details"
        title="Edit Customer"
        description="Update the customer profile. Changes are saved together."
      />
      <CustomerFormWizard companyUuid={companyUuid} customerUuid={id} />
    </div>
  )
}
