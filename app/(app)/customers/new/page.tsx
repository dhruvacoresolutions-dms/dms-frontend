"use client"

import { RouteGate } from "@/components/auth/RouteGate"
import { useAuthStore } from "@/stores/auth-store"
import { CustomerFormWizard } from "@/features/customers/components/CustomerFormWizard"
import { PageHeader } from "@/components/common/PageHeader"
import { PERMISSIONS } from "@/lib/permissions"

export default function CreateCustomerPage() {
  return (
    <RouteGate permission={PERMISSIONS.CUSTOMER.CREATE}>
      <CreateCustomerContent />
    </RouteGate>
  )
}

function CreateCustomerContent() {
  const companyUuid =
    useAuthStore((state) => state.session?.user?.companyUuid) ?? "current"
  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        backHref="/customers"
        backLabel="Customers"
        title="Create Customer"
        description="Add a new customer to the master."
      />
      <CustomerFormWizard companyUuid={companyUuid} />
    </div>
  )
}
