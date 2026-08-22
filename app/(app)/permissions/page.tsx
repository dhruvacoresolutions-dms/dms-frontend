"use client"

import { useState } from "react"
import { ShieldCheck, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/common/PageHeader"
import { TableSkeleton } from "@/components/common/LoadingState"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { usePermissions } from "@/features/permissions/hooks/use-permissions"

export default function PermissionsPage() {
  const [search, setSearch] = useState("")
  const { data: permissions, isLoading, error, refetch } = usePermissions()

  const filtered = permissions?.filter(
    (p) =>
      !search ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.moduleCode.toLowerCase().includes(search.toLowerCase()) ||
      p.resourceCode.toLowerCase().includes(search.toLowerCase()) ||
      p.action.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader title="Permissions" description="View all system permissions" />

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search permissions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={10} />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : !filtered || filtered.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No permissions found" description="No permissions match your search." />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((perm) => (
                <TableRow key={perm.publicId}>
                  <TableCell className="font-mono text-sm">{perm.code}</TableCell>
                  <TableCell><Badge variant="secondary">{perm.moduleCode}</Badge></TableCell>
                  <TableCell>{perm.resourceCode}</TableCell>
                  <TableCell><span className="capitalize">{perm.action}</span></TableCell>
                  <TableCell><Badge variant={perm.status === "ACTIVE" ? "default" : "outline"}>{perm.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}