"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/common/StatusBadge"
import { formatDateTime, formatReference } from "@/lib/format"
import type { CustomerResponse } from "../api/customer.types"

function Field({
  label,
  value,
  mono,
  className = "",
  multiline = false,
}: {
  label: string
  value?: string | number | null
  mono?: boolean
  className?: string
  multiline?: boolean
}) {
  const hasValue = value !== undefined && value !== null && value !== ""
  if (!hasValue) return null
  return (
    <div className={`min-w-0 ${className}`}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={`mt-1 font-medium ${mono ? "font-mono" : ""} ${multiline ? "break-words" : "truncate"}`}
        title={hasValue ? String(value) : undefined}
      >
        {value}
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
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  )
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
  const pathLabel = [...(customer.territoryPath ?? [])]
    .reverse()
    .map((segment) => segment.code)
    .join(" / ")
  const address = [
    customer.addressLine1,
    customer.addressLine2,
    customer.landmark,
  ]
    .filter(Boolean)
    .join(", ")
  const coordinates =
    customer.latitude != null && customer.longitude != null
      ? `${customer.latitude}, ${customer.longitude}`
      : undefined
  const shopHours =
    customer.shopTimings?.openTime && customer.shopTimings.closeTime
      ? `${customer.shopTimings.openTime} – ${customer.shopTimings.closeTime}`
      : undefined
  const hasClassification = [
    names.subType,
    names.channel,
    names.segment,
    names.category,
    names.class,
    names.group,
  ].some(Boolean)

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Customer &amp; contact</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <Field label="Customer Code" value={customer.customerCode} mono />
            <Field label="Customer Type" value={names.customerType} />
            <Field label="Contact Person" value={customer.contactPerson} />
            <Field
              label="Source"
              value={SOURCE_LABELS[customer.source] ?? customer.source}
            />
            <Field label="Mobile" value={customer.mobile} mono />
            <Field label="WhatsApp" value={customer.whatsappNumber} mono />
            <Field
              label="Alternate Mobile"
              value={customer.alternateMobile}
              mono
            />
            <Field label="Email" value={customer.email} />
            <Field label="Date of Birth" value={customer.dateOfBirth} />
            <Field label="Anniversary Date" value={customer.anniversaryDate} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address &amp; territory</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <Field label="City" value={customer.city} />
            <Field label="State" value={customer.state} />
            <Field label="Pincode" value={customer.pincode} mono />
            <Field label="Territory" value={names.territory ?? "Unassigned"} />
            <Field
              label="Address"
              value={address}
              className="sm:col-span-2"
              multiline
            />
            <Field label="Latitude / Longitude" value={coordinates} mono />
            <BadgeField label="Geography Status">
              <StatusBadge status={customer.geographyStatus} />
            </BadgeField>
            <Field
              label="Territory Path"
              value={pathLabel || undefined}
              mono
              className="sm:col-span-2"
            />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business profile</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <Field label="Business Type" value={names.businessType} />
            <Field label="Shop Size" value={names.shopSize} />
            <Field label="Monthly Potential" value={names.monthlyPotential} />
            <Field label="Established Year" value={customer.establishedYear} />
            <Field label="Shop Hours" value={shopHours} />
            <Field label="Preferred Language" value={names.preferredLanguage} />
          </dl>
          {hasClassification ? (
            <div className="mt-4 border-t pt-4">
              <p className="mb-3 text-xs font-medium text-muted-foreground">
                Classification
              </p>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <Field label="Sub Type" value={names.subType} />
                <Field label="Channel" value={names.channel} />
                <Field label="Segment" value={names.segment} />
                <Field label="Category" value={names.category} />
                <Field label="Class" value={names.class} />
                <Field label="Group" value={names.group} />
              </dl>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Tax &amp; compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
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

        <Card size="sm">
          <CardHeader>
            <CardTitle>Record activity</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              <Field
                label="Created"
                value={formatDateTime(customer.createdAt)}
              />
              <Field
                label="Created By"
                value={formatReference(customer.createdBy)}
              />
              <Field
                label="Last Updated"
                value={formatDateTime(customer.updatedAt)}
              />
              <Field
                label="Updated By"
                value={formatReference(customer.updatedBy)}
              />
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
