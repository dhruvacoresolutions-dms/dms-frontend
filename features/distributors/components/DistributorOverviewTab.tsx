"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/common/StatusBadge"
import { formatDate } from "@/lib/format"
import type { DistributorResponse } from "@/features/distributors/api/distributor.types"

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value || "—"}</dd>
    </div>
  )
}

function Flag({ label, value }: { label: string; value?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd>
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "Enabled" : "Disabled"}
        </Badge>
      </dd>
    </div>
  )
}

export function DistributorOverviewTab({
  distributor,
}: {
  distributor: DistributorResponse
}) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Code" value={distributor.distributorCode} />
            <Field label="Name" value={distributor.distributorName} />
            <Field label="Legal Name" value={distributor.legalName} />
            <Field
              label="Distributor Type"
              value={
                distributor.distributorTypeName ??
                distributor.distributorTypeCode
              }
            />
            <Field
              label="Business Constitution"
              value={
                distributor.businessConstitutionName ??
                distributor.businessConstitutionCode
              }
            />
            <Field
              label="Effective From"
              value={formatDate(distributor.effectiveFrom)}
            />
            <div>
              <dt className="text-xs text-muted-foreground">Status</dt>
              <dd>
                <StatusBadge status={distributor.status} />
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact &amp; Address</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Primary Contact"
              value={distributor.primaryContactName}
            />
            <Field label="Mobile Number" value={distributor.mobileNumber} />
            <Field label="Email" value={distributor.email} />
            <Field label="Postal Code" value={distributor.postalCode} />
            <Field label="Geography" value={distributor.geographyType} />
            <Field label="Address" value={distributor.addressLine1} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tax &amp; Commercial</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Tax Registration"
              value={distributor.taxRegistrationStatus}
            />
            <Field
              label="Tax Profile"
              value={distributor.taxProfileName ?? distributor.taxProfileCode}
            />
            <Field
              label="Payment Terms"
              value={distributor.paymentTermName ?? distributor.paymentTermCode}
            />
            <div>
              <dt className="text-xs text-muted-foreground">Credit Allowed</dt>
              <dd>
                <Badge
                  variant={distributor.creditAllowed ? "default" : "secondary"}
                >
                  {distributor.creditAllowed ? "Yes" : "No"}
                </Badge>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Operating Modes</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <Flag label="SFA" value={distributor.sfaEnabled} />
            <Flag
              label="Order Booking"
              value={distributor.orderBookingEnabled}
            />
            <Flag label="Collection" value={distributor.collectionEnabled} />
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
