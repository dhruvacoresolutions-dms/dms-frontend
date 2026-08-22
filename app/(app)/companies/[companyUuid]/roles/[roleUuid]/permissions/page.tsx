"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/common/PageHeader"
import { LoadingState } from "@/components/common/LoadingState"
import { useRole } from "@/features/roles/hooks/use-role"
import { useUpdateRolePermissions } from "@/features/roles/hooks/use-update-role-permissions"
import { usePermissionMatrix } from "@/features/permissions/hooks/use-permission-matrix"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"

export default function RolePermissionsPage() {
  const params = useParams<{ companyUuid: string; roleUuid: string }>()
  const companyUuid = params.companyUuid
  const roleUuid = params.roleUuid

  const { data: role, isLoading: roleLoading } = useRole(companyUuid, roleUuid)
  const { data: matrix, isLoading: matrixLoading } = usePermissionMatrix()
  const updateMutation = useUpdateRolePermissions(companyUuid, roleUuid)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState("")
  const [hasChanges, setHasChanges] = useState(false)
  const [didInit, setDidInit] = useState(false)

  if (role?.permissions && !didInit) {
    setDidInit(true)
    setSelected(new Set(role.permissions))
  }

  const togglePermission = (code: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
    setHasChanges(true)
  }

  const toggleModule = (codes: string[]) => {
    setSelected((prev) => {
      const next = new Set(prev)
      const allSelected = codes.every((c) => next.has(c))
      for (const c of codes) {
        if (allSelected) next.delete(c)
        else next.add(c)
      }
      return next
    })
    setHasChanges(true)
  }

  if (roleLoading || matrixLoading) return <LoadingState />

  const filteredMatrix =
    matrix?.filter((m) =>
      !search || m.moduleCode.toLowerCase().includes(search.toLowerCase()) ||
      m.resources.some((r) =>
        r.resourceCode.toLowerCase().includes(search.toLowerCase()) ||
        r.actions.some((a) => a.permissionCode.toLowerCase().includes(search.toLowerCase()))
      )
    ) ?? []

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title={`Manage Permissions: ${role?.name ?? ""}`}
        description="Select permissions for this role. Saving replaces all current permissions."
        action={
          <div className="flex gap-2">
            <Button variant="outline" nativeButton={false} render={<Link href={`/companies/${companyUuid}/roles/${roleUuid}`} />}>
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
        <div className="relative flex-1 max-w-sm">
          <Input placeholder="Search permissions..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Badge variant="secondary">{selected.size} selected</Badge>
        {hasChanges && <Badge variant="outline" className="text-amber-600">Unsaved changes</Badge>}
      </div>

      <div className="space-y-6">
        {filteredMatrix.map((module) => {
          const allCodes = module.resources.flatMap((r) => r.actions.map((a) => a.permissionCode))
          const allSelected = allCodes.length > 0 && allCodes.every((c) => selected.has(c))

          return (
            <div key={module.moduleCode} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={() => toggleModule(allCodes)}
                />
                <h3 className="font-semibold capitalize">{module.moduleName}</h3>
                <Badge variant="secondary" className="text-xs">{allCodes.length} permissions</Badge>
              </div>
              <div className="space-y-3 pl-8">
                {module.resources.map((resource) => (
                  <div key={resource.resourceCode} className="space-y-2">
                    <p className="text-sm font-medium">{resource.resourceName}</p>
                    <div className="flex flex-wrap gap-2">
                      {resource.actions.map((action) => (
                        <label
                          key={action.permissionCode}
                          className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm cursor-pointer transition-colors ${
                            selected.has(action.permissionCode)
                              ? "bg-primary/10 border-primary"
                              : "hover:bg-muted"
                          }`}
                        >
                          <Checkbox
                            checked={selected.has(action.permissionCode)}
                            onCheckedChange={() => togglePermission(action.permissionCode)}
                          />
                          <span className="capitalize">{action.action}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
