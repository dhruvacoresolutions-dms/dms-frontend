"use client"

import { useState } from "react"
import { Plus, Trash2, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { GeographyCombobox } from "@/features/geographies/components/GeographyCombobox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { LoadingState } from "@/components/common/LoadingState"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import {
  useEmployeeGeographies,
  useAssignEmployeeGeography,
  useRemoveEmployeeGeography,
} from "@/features/employees/hooks/use-employee-geographies"
import { toast } from "sonner"
import { getApiError, getApiErrorMessage } from "@/lib/api/api-error"

type Props = { companyUuid: string; employeeUuid: string }

export function EmployeeGeographiesTab({ companyUuid, employeeUuid }: Props) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string>("")
  const [primaryAssignment, setPrimaryAssignment] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<{ uuid: string; name: string } | null>(null)

  const geographies = useEmployeeGeographies(companyUuid, employeeUuid)
  const assignMutation = useAssignEmployeeGeography(companyUuid, employeeUuid)
  const removeMutation = useRemoveEmployeeGeography(companyUuid, employeeUuid)
  const assignedUuids = geographies.data?.map((a) => a.geographyUuid) ?? []

  if (geographies.isLoading) return <LoadingState />
  if (geographies.error) return <ErrorState />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Assigned Geographies</h3>
        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next)
            if (!next) {
              setSelected("")
              setPrimaryAssignment(false)
            }
          }}
        >
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="mr-2 size-4" /> Assign Geography
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Geography</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <GeographyCombobox
                companyUuid={companyUuid}
                value={selected || null}
                onValueChange={(v) => setSelected(v ?? "")}
                placeholder="Search geography..."
                size={100}
                excludeUuids={assignedUuids}
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  id="primary-assignment"
                  checked={primaryAssignment}
                  onCheckedChange={(checked) =>
                    setPrimaryAssignment(checked === true)
                  }
                />
                <Label htmlFor="primary-assignment">Set as primary</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button
                  disabled={!selected || assignMutation.isPending}
                  onClick={() => {
                    if (!selected) return
                    assignMutation.mutate(
                      { geographyUuid: selected, primaryAssignment },
                      {
                        onSuccess: () => { toast.success("Geography assigned"); setOpen(false); setSelected(""); setPrimaryAssignment(false) },
                        onError: (error) => {
                          // Backend returns 409 EMPLOYEE_GEOGRAPHY_ALREADY_ASSIGNED
                          // if it was assigned elsewhere; surface its message
                          // and reset so the (refreshed) list is accurate.
                          if (getApiError(error)?.code === "EMPLOYEE_GEOGRAPHY_ALREADY_ASSIGNED") {
                            toast.error(getApiErrorMessage(error, "This geography is already assigned to the employee"))
                            geographies.refetch()
                            setOpen(false)
                            setSelected("")
                            setPrimaryAssignment(false)
                            return
                          }
                          toast.error(getApiErrorMessage(error, "Failed"))
                        },
                      }
                    )
                  }}
                >
                  {assignMutation.isPending ? "Assigning..." : "Assign"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!geographies.data || geographies.data.length === 0 ? (
        <EmptyState icon={MapPin} title="No geographies assigned" description="Assign a geography to this employee." />
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Primary</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {geographies.data.map((g) => (
                <TableRow key={g.assignmentUuid}>
                  <TableCell className="font-mono">{g.geographyCode}</TableCell>
                  <TableCell className="font-medium">{g.geographyName}</TableCell>
                  <TableCell>{g.geographyType}</TableCell>
                  <TableCell>{g.primaryAssignment ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon-sm" onClick={() => setRemoveTarget({ uuid: g.geographyUuid, name: g.geographyName })}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title="Remove geography?"
        description={`Remove "${removeTarget?.name}" from this employee?`}
        confirmLabel="Remove"
        variant="destructive"
        isLoading={removeMutation.isPending}
        onConfirm={() => {
          if (!removeTarget) return
          removeMutation.mutate(removeTarget.uuid, {
            onSuccess: () => { toast.success("Geography removed"); setRemoveTarget(null) },
            onError: (error) => { toast.error(getApiErrorMessage(error, "Failed")) },
          })
        }}
      />
    </div>
  )
}
