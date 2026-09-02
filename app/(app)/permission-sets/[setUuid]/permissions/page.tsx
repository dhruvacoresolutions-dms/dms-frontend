"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/common/PageHeader"
import { LoadingState } from "@/components/common/LoadingState"
import { usePermissionSet } from "@/features/permission-sets/hooks/use-permission-set"
import { useUpdatePermissionSetPermissions } from "@/features/permission-sets/hooks/use-update-permission-set-permissions"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"

export default function PermissionSetPermissionsPage() {
  const params = useParams<{ setUuid: string }>()
  const companyUuid = useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const setUuid = params.setUuid

  const { data: ps, isLoading: psLoading } = usePermissionSet(companyUuid, setUuid)
  const updateMutation = useUpdatePermissionSetPermissions(companyUuid, setUuid)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [inputCode, setInputCode] = useState("")
  const [hasChanges, setHasChanges] = useState(false)
  const [didInit, setDidInit] = useState(false)

  if (ps?.permissions && !didInit) {
    setDidInit(true)
    setSelected(new Set(ps.permissions))
  }

  const addCode = () => {
    const code = inputCode.trim()
    if (!code) return
    setSelected((prev) => {
      const next = new Set(prev)
      next.add(code)
      return next
    })
    setInputCode("")
    setHasChanges(true)
  }
  const removeCode = (code: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.delete(code)
      return next
    })
    setHasChanges(true)
  }

  if (psLoading) return <LoadingState />

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title={`Manage Permissions: ${ps?.name ?? ""}`}
        description="Select permissions. Saving replaces all current permissions."
        action={
          <div className="flex gap-2">
            <Button variant="outline" nativeButton={false} render={<Link href={`/permission-sets/${setUuid}`} />}>
              <ArrowLeft className="mr-2 size-4" /> Back
            </Button>
            <Button
              disabled={!hasChanges || updateMutation.isPending}
              onClick={() => {
                updateMutation.mutate(
                  { permissionCodes: Array.from(selected) },
                  {
                    onSuccess: () => { toast.success("Permissions updated"); setHasChanges(false) },
                    onError: (error) => { toast.error(getApiErrorMessage(error, "Failed")) },
                  }
                )
              }}
            >
              {updateMutation.isPending ? "Saving..." : "Save Permissions"}
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm flex gap-2">
          <Input placeholder="Add permission code..." value={inputCode} onChange={(e) => setInputCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCode())} />
          <Button variant="secondary" onClick={addCode}>Add</Button>
        </div>
        <Badge variant="secondary">{selected.size} selected</Badge>
        {hasChanges && <Badge variant="outline" className="text-amber-600">Unsaved changes</Badge>}
      </div>

      <div className="rounded-lg border p-4">
        {selected.size === 0 ? (
          <p className="text-sm text-muted-foreground">No permissions selected. Add codes above.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {Array.from(selected).map((code) => (
              <Badge key={code} variant="secondary" className="gap-1">
                {code}
                <button onClick={() => removeCode(code)} className="ml-1 text-xs hover:text-destructive">×</button>
              </Badge>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-3">Permission list API removed. Enter codes manually.</p>
      </div>
    </div>
  )
}
