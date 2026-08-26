"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/common/PageHeader"
import { LoadingState } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { useCompany } from "@/features/companies/hooks/use-company"
import { useUpdateCompanyFeatures } from "@/features/companies/hooks/use-update-company-features"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"

const AVAILABLE_FEATURES = [
  "USERS",
  "EMPLOYEES",
  "DESIGNATIONS",
  "GEOGRAPHIES",
  "ROLES",
  "PERMISSION_SETS",
  "PERMISSIONS",
  "RBAC_AUDIT",
  "DOCUMENTS",
  "REPORTS",
  "DISTRIBUTOR_MANAGEMENT",
  "INVENTORY",
  "ORDERS",
  "INVOICING",
]

export default function FeaturesPage() {
  const params = useParams<{ companyUuid: string }>()
  const companyUuid = params.companyUuid

  const { data: company, isLoading, error, refetch } = useCompany(companyUuid)
  const updateMutation = useUpdateCompanyFeatures(companyUuid)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [hasChanges, setHasChanges] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [didInit, setDidInit] = useState(false)

  if (company?.enabledFeatures && !didInit) {
    setDidInit(true)
    setSelected(new Set(company.enabledFeatures))
  }

  const toggle = (feature: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(feature)) next.delete(feature)
      else next.add(feature)
      return next
    })
    setHasChanges(true)
  }

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState onRetry={refetch} />

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Feature Management"
        description="Enable or disable features for this company. Saving replaces all feature entitlements."
        action={
          <Button disabled={!hasChanges || updateMutation.isPending} onClick={() => setConfirmOpen(true)}>
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {AVAILABLE_FEATURES.map((feature) => (
          <label
            key={feature}
            className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
              selected.has(feature)
                ? "bg-primary/5 border-primary"
                : "hover:bg-muted"
            }`}
          >
            <Checkbox
              checked={selected.has(feature)}
              onCheckedChange={() => toggle(feature)}
            />
            <div className="flex-1">
              <p className="text-sm font-medium">{feature.replace(/_/g, " ")}</p>
            </div>
            {selected.has(feature) && <Badge variant="default">Enabled</Badge>}
          </label>
        ))}
      </div>

      {hasChanges && (
        <p className="text-sm text-muted-foreground">
          You have unsaved changes. {selected.size} feature(s) will be enabled.
        </p>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Save Feature Entitlements?"
        description={`This will replace all feature entitlements with your current selection (${selected.size} features).`}
        confirmLabel="Save"
        isLoading={updateMutation.isPending}
        onConfirm={() => {
          updateMutation.mutate(
            { enabledFeatures: Array.from(selected) },
            {
              onSuccess: () => { toast.success("Features updated"); setHasChanges(false) },
              onError: (error) => { toast.error(getApiErrorMessage(error, "Failed")) },
            }
          )
        }}
      />
    </div>
  )
}