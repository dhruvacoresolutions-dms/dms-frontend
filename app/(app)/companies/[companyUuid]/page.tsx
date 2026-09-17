"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/common/PageHeader"
import { StatusBadge } from "@/components/common/StatusBadge"
import { LoadingState } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { useCompany } from "@/features/companies/hooks/use-company"
import { CompanyAddressesTab } from "@/features/companies/components/CompanyAddressesTab"
import { CompanyFeaturesTab } from "@/features/companies/components/CompanyFeaturesTab"
import { CompanyStatusDialog } from "@/features/companies/components/CompanyStatusDialog"

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value ?? "—"}</span>
    </div>
  )
}

export default function CompanyDetailPage() {
  const params = useParams<{ companyUuid: string }>()
  const companyUuid = params.companyUuid
  const [statusOpen, setStatusOpen] = useState(false)

  const { data: company, isLoading, error, refetch } = useCompany(companyUuid)

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState onRetry={refetch} />
  if (!company) return <ErrorState message="Company not found" />

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title={company.companyName}
        description={`Company code: ${company.companyCode}`}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={company.status} />
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={`/companies/${companyUuid}/edit`} />}
            >
              <Pencil className="mr-2 size-4" />
              Edit
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-6 space-y-3">
              <h3 className="text-lg font-semibold">Company Information</h3>
              <div className="space-y-2 text-sm">
                <Row label="Code" value={<span className="font-mono">{company.companyCode}</span>} />
                <Row label="Company Type" value={company.companyType} />
                <Row label="Business Domain" value={company.businessDomain} />
                <Row label="Legal Name" value={company.legalName} />
                <Row label="GSTIN" value={company.gstin && <span className="font-mono">{company.gstin}</span>} />
                <Row label="PAN" value={company.pan && <span className="font-mono">{company.pan}</span>} />
                <Row label="CIN" value={company.cin && <span className="font-mono">{company.cin}</span>} />
                <Row label="Website" value={company.website} />
                <Row label="ERP System" value={company.erpSystem} />
                <Row
                  label="External Code"
                  value={company.externalCompanyCode && <span className="font-mono">{company.externalCompanyCode}</span>}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-lg border p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Status</h3>
                  <Button variant="outline" size="sm" onClick={() => setStatusOpen(true)}>
                    Change Status
                  </Button>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Status</span>
                    <StatusBadge status={company.status} />
                  </div>
                </div>
              </div>
              <div className="rounded-lg border p-6 space-y-3">
                <h3 className="text-lg font-semibold">Business Configuration</h3>
                <div className="space-y-2 text-sm">
                  <Row label="Financial Year" value={company.financialYear} />
                  <Row label="Currency" value={company.currency} />
                  <Row label="Time Zone" value={company.timeZone} />
                  <Row label="Subscription Plan" value={company.subscriptionPlan} />
                </div>
              </div>
              {(company.primaryContact || company.primaryAddress) && (
                <div className="rounded-lg border p-6 space-y-3">
                  <h3 className="text-lg font-semibold">Primary Contact & Address</h3>
                  <div className="space-y-2 text-sm">
                    <Row label="Contact" value={company.primaryContact?.name} />
                    <Row label="Mobile" value={company.primaryContact?.mobile} />
                    <Row label="Email" value={company.primaryContact?.email} />
                    <Row
                      label="Address"
                      value={
                        company.primaryAddress
                          ? [
                              company.primaryAddress.line1,
                              company.primaryAddress.line2,
                              company.primaryAddress.city,
                              company.primaryAddress.state,
                              company.primaryAddress.postalCode,
                              company.primaryAddress.countryCode,
                            ]
                              .filter(Boolean)
                              .join(", ")
                          : undefined
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="addresses">
          <CompanyAddressesTab companyUuid={companyUuid} />
        </TabsContent>

        <TabsContent value="features">
          <CompanyFeaturesTab companyUuid={companyUuid} />
        </TabsContent>
      </Tabs>

      <CompanyStatusDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        companyUuid={companyUuid}
        companyName={company.companyName}
        currentStatus={company.status}
      />
    </div>
  )
}
