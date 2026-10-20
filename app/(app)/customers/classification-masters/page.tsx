"use client"

import { useState } from "react"
import { DatabaseZap, ListTree } from "lucide-react"
import { toast } from "sonner"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/common/PageHeader"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { RouteGate } from "@/components/auth/RouteGate"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { PERMISSIONS } from "@/lib/permissions"
import { CustomerMasterManager } from "@/features/customers/components/CustomerMasterManager"
import { useLoadCustomerDefaults } from "@/features/customers/hooks/use-load-customer-defaults"
import { CUSTOMER_MASTER_CONFIGS } from "@/features/customers/lib/customer-master-config"

export default function CustomerClassificationMastersPage() {
  return (
    <RouteGate permission={PERMISSIONS.CUSTOMER.VIEW}>
      <CustomerClassificationMastersContent />
    </RouteGate>
  )
}

function CustomerClassificationMastersContent() {
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const [defaultsOpen, setDefaultsOpen] = useState(false)
  const loadDefaults = useLoadCustomerDefaults(companyUuid)

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Classification Masters"
        description="Sub types, channels, segments, categories, classes, groups and lookups used to classify outlets."
        action={
          <PermissionGate permission={PERMISSIONS.CUSTOMER.BOOTSTRAP}>
            <Button variant="outline" onClick={() => setDefaultsOpen(true)}>
              <DatabaseZap className="mr-2 size-4" />
              Load defaults
            </Button>
          </PermissionGate>
        }
      />

      <p className="text-sm text-muted-foreground">
        Defaults seed the standard classification catalogue. Existing rows are
        never overwritten, so it is safe to run more than once.
      </p>

      <Tabs defaultValue={CUSTOMER_MASTER_CONFIGS[0].kind}>
        <TabsList className="h-auto flex-wrap">
          {CUSTOMER_MASTER_CONFIGS.map((config) => (
            <TabsTrigger key={config.kind} value={config.kind}>
              {config.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {CUSTOMER_MASTER_CONFIGS.map((config) => (
          <TabsContent key={config.kind} value={config.kind} className="pt-3">
            <CustomerMasterManager companyUuid={companyUuid} config={config} />
          </TabsContent>
        ))}
      </Tabs>

      <ConfirmDialog
        open={defaultsOpen}
        onOpenChange={setDefaultsOpen}
        title="Load default classification values?"
        description="Missing default sub types, channels, segments, categories, classes, groups and lookups will be inserted. Existing values stay untouched."
        confirmLabel="Load defaults"
        isLoading={loadDefaults.isPending}
        onConfirm={() => {
          loadDefaults.mutate(undefined, {
            onSuccess: (result) => {
              toast.success(
                result.insertedRows > 0
                  ? `${result.insertedRows} default row${result.insertedRows === 1 ? "" : "s"} inserted`
                  : "Defaults already present — nothing to insert"
              )
              setDefaultsOpen(false)
            },
            onError: (err) =>
              toast.error(getApiErrorMessage(err, "Failed to load defaults")),
          })
        }}
      />

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ListTree className="size-3.5" aria-hidden="true" />
        Inactive values stay visible here but are hidden from the customer form.
      </div>
    </div>
  )
}
