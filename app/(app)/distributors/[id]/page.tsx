"use client"

import { use, useState } from "react"
import Link from "next/link"
import { useAuthStore } from "@/stores/auth-store"
import { ArrowLeft, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/common/PageHeader"
import { LoadingState } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { StatusBadge } from "@/components/common/StatusBadge"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { RouteGate } from "@/components/auth/RouteGate"
import { PERMISSIONS } from "@/lib/permissions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDistributor } from "@/features/distributors/hooks/use-distributor"
import { DistributorFormDialog } from "@/features/distributors/components/DistributorFormDialog"
import { DistributorOverviewTab } from "@/features/distributors/components/DistributorOverviewTab"
import { DistributorBranchesSection } from "@/features/distributors/components/DistributorBranchesSection"
import { DistributorLicensesSection } from "@/features/distributors/components/DistributorLicensesSection"
import { DistributorBankAccountSection } from "@/features/distributors/components/DistributorBankAccountSection"
import { DistributorLoginSection } from "@/features/distributors/components/DistributorLoginSection"

export default function DistributorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <RouteGate permission={PERMISSIONS.DISTRIBUTOR.VIEW}>
      <DistributorDetailContent params={params} />
    </RouteGate>
  )
}

function DistributorDetailContent({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const [editOpen, setEditOpen] = useState(false)

  const { data: distributor, isLoading, error, refetch } = useDistributor(
    companyUuid,
    id
  )

  if (isLoading) return <LoadingState message="Loading distributor..." />
  if (error || !distributor) return <ErrorState onRetry={refetch} />

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title={distributor.distributorName}
        description={distributor.distributorCode}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={distributor.status} />
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/distributors" />}
            >
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Button>
            <PermissionGate permission={PERMISSIONS.DISTRIBUTOR.UPDATE}>
              <Button onClick={() => setEditOpen(true)}>
                <Pencil className="mr-2 size-4" />
                Edit
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="licenses">Licenses</TabsTrigger>
          <TabsTrigger value="bank">Bank Account</TabsTrigger>
          <TabsTrigger value="login">Login</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <DistributorOverviewTab distributor={distributor} />
        </TabsContent>

        <TabsContent value="branches">
          <DistributorBranchesSection
            companyUuid={companyUuid}
            distributorUuid={id}
          />
        </TabsContent>

        <TabsContent value="licenses">
          <DistributorLicensesSection
            companyUuid={companyUuid}
            distributorUuid={id}
          />
        </TabsContent>

        <TabsContent value="bank">
          <DistributorBankAccountSection
            companyUuid={companyUuid}
            distributorUuid={id}
          />
        </TabsContent>

        <TabsContent value="login">
          <DistributorLoginSection
            companyUuid={companyUuid}
            distributorUuid={id}
            distributorActive={distributor.status === "ACTIVE"}
          />
        </TabsContent>
      </Tabs>

      <DistributorFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        companyUuid={companyUuid}
        distributorUuid={id}
      />
    </div>
  )
}
