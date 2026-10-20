"use client"

import { useAuthStore } from "@/stores/auth-store"
import { PageHeader } from "@/components/common/PageHeader"
import { LoadingState } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { CalendarSectionNav } from "@/features/company-calendar/components/CalendarSectionNav"
import { VisitRadiusCard } from "@/features/company-calendar/components/VisitRadiusCard"
import { ClaimPolicyCard } from "@/features/company-calendar/components/ClaimPolicyCard"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { RouteGate } from "@/components/auth/RouteGate"
import { PERMISSIONS } from "@/lib/permissions"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { useCalendarSettings } from "@/features/company-calendar/hooks/use-calendar-settings"

export default function CalendarSettingsPage() {
  return (
    <RouteGate
      permissions={[
        PERMISSIONS.VISIT_RADIUS.VIEW,
        PERMISSIONS.CLAIM_POLICY.VIEW,
      ]}
      require="any"
    >
      <CalendarSettingsContent />
    </RouteGate>
  )
}

function CalendarSettingsContent() {
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const {
    data: settings,
    isLoading,
    error,
    refetch,
  } = useCalendarSettings(companyUuid)

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Calendar Settings"
        description="Company visit radius and expense-claim policy."
      />
      <CalendarSectionNav />

      {isLoading ? (
        <LoadingState message="Loading calendar settings…" />
      ) : error && !settings ? (
        <ErrorState
          message={getApiErrorMessage(
            error,
            "Failed to load calendar settings"
          )}
          onRetry={() => void refetch()}
        />
      ) : settings ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <PermissionGate permission={PERMISSIONS.VISIT_RADIUS.VIEW}>
            <VisitRadiusCard companyUuid={companyUuid} settings={settings} />
          </PermissionGate>
          <PermissionGate permission={PERMISSIONS.CLAIM_POLICY.VIEW}>
            <ClaimPolicyCard companyUuid={companyUuid} settings={settings} />
          </PermissionGate>
        </div>
      ) : null}
    </div>
  )
}
