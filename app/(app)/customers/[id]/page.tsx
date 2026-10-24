"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, Pencil, Workflow } from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/common/PageHeader"
import { LoadingState } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { StatusBadge } from "@/components/common/StatusBadge"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { RouteGate } from "@/components/auth/RouteGate"
import { PERMISSIONS } from "@/lib/permissions"
import { useCustomer } from "@/features/customers/hooks/use-customer"
import { CustomerOverviewTab } from "@/features/customers/components/CustomerOverviewTab"
import { CustomerBankSection } from "@/features/customers/components/CustomerBankSection"
import { CustomerCreditSection } from "@/features/customers/components/CustomerCreditSection"
import { CustomerKycSection } from "@/features/customers/components/CustomerKycSection"
import { CustomerHistoryTab } from "@/features/customers/components/CustomerHistoryTab"
import {
  CustomerLifecycleDialog,
  lifecycleActionsFor,
} from "@/features/customers/components/CustomerLifecycleDialog"
import type { CustomerLifecycleAction } from "@/features/customers/api/customer.types"

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <RouteGate permission={PERMISSIONS.CUSTOMER.VIEW}>
      <CustomerDetailContent params={params} />
    </RouteGate>
  )
}

function CustomerDetailContent({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const [lifecycleAction, setLifecycleAction] =
    useState<CustomerLifecycleAction | null>(null)

  const {
    data: customer,
    isLoading,
    error,
    refetch,
  } = useCustomer(companyUuid, id)

  if (isLoading) return <LoadingState message="Loading customer..." />
  if (error || !customer) return <ErrorState onRetry={refetch} />

  const editable =
    customer.lifecycleStatus === "DRAFT" ||
    customer.lifecycleStatus === "REWORK"
  const transitions = lifecycleActionsFor(customer.lifecycleStatus)
  const typeName = customer.displayNames?.customerType

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        backHref="/customers"
        title={customer.shopName}
        description={
          typeName
            ? `${customer.customerCode} · ${typeName}`
            : customer.customerCode
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={customer.lifecycleStatus} />
            {transitions.length > 0 ? (
              <PermissionGate permission={PERMISSIONS.CUSTOMER.MANAGE}>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="outline">
                        <Workflow className="mr-2 size-4" />
                        Update status
                        <ChevronDown className="ml-2 size-4" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end" className="w-auto min-w-52">
                    {transitions.map((t) => (
                      <DropdownMenuItem
                        key={t.action}
                        variant={t.destructive ? "destructive" : "default"}
                        onClick={() => setLifecycleAction(t.action)}
                      >
                        <t.icon className="mr-2 size-4" />
                        {t.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </PermissionGate>
            ) : null}
            <PermissionGate permission={PERMISSIONS.CUSTOMER.UPDATE}>
              <Button
                onClick={() => router.push(`/customers/${id}/edit`)}
                disabled={!editable}
                title={
                  editable
                    ? undefined
                    : "Customers can only be edited while in DRAFT or REWORK."
                }
              >
                <Pencil className="mr-2 size-4" />
                Edit
              </Button>
            </PermissionGate>
          </div>
        }
      />

      {editable ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          This customer is in {customer.lifecycleStatus.toLowerCase()}. Bank,
          credit, and KYC details can be changed until it is submitted.
        </div>
      ) : null}

      <Tabs defaultValue="overview">
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger className="shrink-0" value="overview">
            Overview
          </TabsTrigger>
          <TabsTrigger className="shrink-0" value="bank">
            Bank
          </TabsTrigger>
          <TabsTrigger className="shrink-0" value="credit">
            Credit
          </TabsTrigger>
          <TabsTrigger className="shrink-0" value="kyc">
            KYC
            {customer.kycCount > 0 ? (
              <span className="ml-1 rounded-full bg-muted px-1.5 text-xs tabular-nums">
                {customer.kycCount}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger className="shrink-0" value="history">
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-3">
          <CustomerOverviewTab customer={customer} />
        </TabsContent>
        <TabsContent value="bank" className="pt-3">
          <CustomerBankSection
            companyUuid={companyUuid}
            customerUuid={id}
            customerVersion={customer.version}
            editable={editable}
          />
        </TabsContent>
        <TabsContent value="credit" className="pt-3">
          <CustomerCreditSection
            companyUuid={companyUuid}
            customerUuid={id}
            customerVersion={customer.version}
            editable={editable}
          />
        </TabsContent>
        <TabsContent value="kyc" className="pt-3">
          <CustomerKycSection
            companyUuid={companyUuid}
            customerUuid={id}
            customerVersion={customer.version}
            editable={editable}
          />
        </TabsContent>
        <TabsContent value="history" className="pt-3">
          <CustomerHistoryTab companyUuid={companyUuid} customerUuid={id} />
        </TabsContent>
      </Tabs>

      <CustomerLifecycleDialog
        open={!!lifecycleAction}
        onOpenChange={(open) => !open && setLifecycleAction(null)}
        companyUuid={companyUuid}
        customer={{
          uuid: customer.uuid,
          lifecycleStatus: customer.lifecycleStatus,
          source: customer.source,
          version: customer.version,
        }}
        action={lifecycleAction}
        onSuccess={() => setLifecycleAction(null)}
      />
    </div>
  )
}
