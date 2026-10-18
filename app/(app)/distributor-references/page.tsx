"use client"

import { useAuthStore } from "@/stores/auth-store"
import { PageHeader } from "@/components/common/PageHeader"
import { RouteGate } from "@/components/auth/RouteGate"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PERMISSIONS } from "@/lib/permissions"
import { DISTRIBUTOR_REFERENCE_KINDS } from "@/features/distributors/api/distributor-reference.types"
import { DistributorReferenceManager } from "@/features/distributors/components/DistributorReferenceManager"

export default function DistributorReferencesPage() {
  return (
    <RouteGate permission={PERMISSIONS.DISTRIBUTOR.MASTER_VIEW}>
      <DistributorReferencesContent />
    </RouteGate>
  )
}

function DistributorReferencesContent() {
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Distributor References"
        description="Reference masters used when creating distributors"
      />

      <Tabs defaultValue={DISTRIBUTOR_REFERENCE_KINDS[0].kind}>
        <TabsList>
          {DISTRIBUTOR_REFERENCE_KINDS.map((entry) => (
            <TabsTrigger key={entry.kind} value={entry.kind}>
              {entry.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {DISTRIBUTOR_REFERENCE_KINDS.map((entry) => (
          <TabsContent key={entry.kind} value={entry.kind}>
            <DistributorReferenceManager
              companyUuid={companyUuid}
              kind={entry.kind}
              singular={entry.singular}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
