"use client"

import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/common/StatusBadge"
import type { CustomerResponse } from "../api/customer.types"

function Field({
  label,
  value,
  mono,
}: {
  label: string
  value?: string | number | null
  mono?: boolean
}) {
  const hasValue = value !== undefined && value !== null && value !== ""
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={
          mono
            ? "truncate font-mono text-sm font-medium"
            : "truncate font-medium"
        }
        title={hasValue ? String(value) : undefined}
      >
        {hasValue ? value : "—"}
      </dd>
    </div>
  )
}

function BadgeField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  )
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return format(d, "dd MMM yyyy, hh:mm a")
}

const SOURCE_LABELS: Record<string, string> = {
  ADMIN: "Admin (back office)",
  EMPLOYEE: "Field employee",
  DISTRIBUTOR: "Distributor",
  SELF_REGISTRATION: "Self registration",
}

export function CustomerOverviewTab({
  customer,
}: {
  customer: CustomerResponse
}) {
  const names = customer.displayNames ?? {}
  const path = customer.territoryPath ?? []
  const pathLabel = [...path].reverse().map((p) => p.code).join(" / ")
  const latLong =
    customer.latitude != null && customer.longitude != null
      ? `${customer.latitude}, ${customer.longitude}`
      : undefined
  const addressLines = [
    customer.addressLine1,
    customer.addressLine2,
    customer.landmark,
  ].filter(Boolean)

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <Field label="Customer Code" value={customer.customerCode} mono />
            <Field label="Shop Name" value={customer.shopName} />
            <Field label="Contact Person" value={customer.contactPerson} />
            <Field label="Customer Type" value={names.customerType} />
            <Field
              label="Source"
              value={SOURCE_LABELS[customer.source] ?? customer.source}
            />
            <BadgeField label="Lifecycle">
              <StatusBadge status={customer.lifecycleStatus} />
            </BadgeField>
            <BadgeField label="Record Version">
              <span className="font-mono text-sm">v{customer.version}</span>
            </BadgeField>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <Field label="Mobile" value={customer.mobile} mono />
            <Field
              label="Alternate Mobile"
              value={customer.alternateMobile}
              mono
            />
            <Field label="Email" value={customer.email} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address &amp; territory</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <Field label="Pincode" value={customer.pincode} mono />
            <Field label="City" value={customer.city} />
            <Field label="State" value={customer.state} />
            <Field
              label="Address"
              value={addressLines.length ? addressLines.join(", ") : undefined}
            />
            <Field label="Latitude / Longitude" value={latLong} mono />
            <BadgeField label="Geography Status">
              <StatusBadge status={customer.geographyStatus} />
            </BadgeField>
            <Field label="Territory" value={names.territory ?? "Unassigned"} />
            <Field label="Territory Path" value={pathLabel || undefined} mono />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tax &amp; compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <BadgeField label="GST Registration">
              <Badge
                variant={
                  customer.gstRegistrationType === "REGISTERED"
                    ? "default"
                    : "secondary"
                }
              >
                {customer.gstRegistrationType === "REGISTERED"
                  ? "Registered"
                  : "Unregistered"}
              </Badge>
            </BadgeField>
            <Field label="GSTIN" value={customer.gstin} mono />
            <Field label="PAN" value={customer.pan} mono />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Classification</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <Field label="Sub Type" value={names.subType} />
            <Field label="Channel" value={names.channel} />
            <Field label="Segment" value={names.segment} />
            <Field label="Category" value={names.category} />
            <Field label="Class" value={names.class} />
            <Field label="Group" value={names.group} />
            <Field label="Business Type" value={names.businessType} />
            <Field label="Shop Size" value={names.shopSize} />
            <Field label="Monthly Potential" value={names.monthlyPotential} />
            <Field label="Preferred Language" value={names.preferredLanguage} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <Field label="Created By" value={customer.createdBy} mono />
            <Field label="Created At" value={formatDateTime(customer.createdAt)} />
            <Field label="Updated By" value={customer.updatedBy} mono />
            <Field label="Updated At" value={formatDateTime(customer.updatedAt)} />
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
