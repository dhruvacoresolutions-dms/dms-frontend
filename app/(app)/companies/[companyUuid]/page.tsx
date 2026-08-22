"use client"

import { useParams, useRouter } from "next/navigation"
import { Building2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/common/PageHeader"
import { StatusBadge } from "@/components/common/StatusBadge"
import { LoadingState } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { useCompany } from "@/features/companies/hooks/use-company"
import { CompanyAddressesTab } from "@/features/companies/components/CompanyAddressesTab"

export default function CompanyDetailPage() {
  const params = useParams<{ companyUuid: string }>()
  const companyUuid = params.companyUuid

  const { data: company, isLoading, error, refetch } = useCompany(companyUuid)

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState onRetry={refetch} />
  if (!company) return <ErrorState message="Company not found" />

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title={company.companyName}
        description={`Company code: ${company.companyCode}`}
        action={<StatusBadge status={company.status} />}
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-6 space-y-3">
              <h3 className="text-lg font-semibold">Company Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">UUID</span>
                  <span className="font-mono">{company.publicId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Code</span>
                  <span className="font-mono">{company.companyCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Business Domain</span>
                  <span>{company.businessDomain}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ERP System</span>
                  <span>{company.erpSystem}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Legal Name</span>
                  <span>{company.legalName || "—"}</span>
                </div>
              </div>
            </div>
            <div className="rounded-lg border p-6 space-y-3">
              <h3 className="text-lg font-semibold">Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Status</span>
                  <StatusBadge status={company.status} />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="addresses">
          <CompanyAddressesTab companyUuid={companyUuid} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
