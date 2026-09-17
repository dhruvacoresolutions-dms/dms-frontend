"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { useCompany } from "../hooks/use-company"
import { useUpdateCompanyFeatures } from "../hooks/use-update-company-features"
import { COMPANY_FEATURES } from "../configs/company.config"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"

export function CompanyFeaturesTab({ companyUuid }: { companyUuid: string }) {
  const { data: company, isLoading, error, refetch } = useCompany(companyUuid)
  const updateMutation = useUpdateCompanyFeatures(companyUuid)
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [initFor, setInitFor] = React.useState<string | null>(null)

  // Init (and re-init when viewing a different company) during render —
  // the React-endorsed derived-state pattern.
  if (company && initFor !== company.publicId) {
    setInitFor(company.publicId)
    setSelected(new Set(company.enabledFeatures ?? []))
  }
  const didInit = initFor === company?.publicId

  const baseline = React.useMemo(
    () => new Set(company?.enabledFeatures ?? []),
    [company?.enabledFeatures]
  )
  const hasChanges =
    didInit &&
    (selected.size !== baseline.size ||
      [...selected].some((f) => !baseline.has(f)))

  const toggle = (feature: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(feature)) next.delete(feature)
      else next.add(feature)
      return next
    })
  }

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState onRetry={refetch} />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Feature Entitlements</h3>
        <Button
          size="sm"
          disabled={!hasChanges || updateMutation.isPending}
          onClick={() => setConfirmOpen(true)}
        >
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Saving replaces all feature entitlements for this company.
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        {COMPANY_FEATURES.map((feature) => (
          <label
            key={feature.value}
            className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
              selected.has(feature.value)
                ? "bg-primary/5 border-primary"
                : "hover:bg-muted"
            }`}
          >
            <Checkbox
              checked={selected.has(feature.value)}
              onCheckedChange={() => toggle(feature.value)}
            />
            <div className="flex-1 space-y-0.5">
              <p className="text-sm font-medium">{feature.label}</p>
              <p className="text-xs text-muted-foreground">
                {feature.description}
              </p>
            </div>
            {selected.has(feature.value) && (
              <Badge variant="default">Enabled</Badge>
            )}
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
              onSuccess: () => {
                toast.success("Features updated")
                setConfirmOpen(false)
                refetch()
              },
              onError: (error) => {
                toast.error(getApiErrorMessage(error, "Failed"))
              },
            }
          )
        }}
      />
    </div>
  )
}
