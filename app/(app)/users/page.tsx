"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { UserPlus, Search, MoreHorizontal, Eye, Edit, ToggleLeft, ToggleRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/common/StatusBadge"
import { PageHeader } from "@/components/common/PageHeader"
import { TableSkeleton } from "@/components/common/LoadingState"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { useUsers } from "@/features/users/hooks/use-users"
import { useUpdateUserStatus } from "@/features/users/hooks/use-update-user-status"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"

export default function UsersPage() {
  const router = useRouter()
  const companyUuid = useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [statusToggle, setStatusToggle] = useState<{
    userUuid: string
    currentStatus: string
  } | null>(null)

  const { data, isLoading, error, refetch } = useUsers(companyUuid, {
    search: search || undefined,
    page,
    size: 20,
  })

  const updateStatusMutation = useUpdateUserStatus(companyUuid)

  const users = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Users"
        description="Manage company users"
        action={
          <Button nativeButton={false} render={<Link href={`/users/new`} />}>
            <UserPlus className="mr-2 size-4" />
            Create User
          </Button>
        }
      />

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : users.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="No users found"
          description={
            search
              ? "Try a different search term."
              : "Get started by creating a user."
          }
        >
          {!search && (
            <Button nativeButton={false} render={<Link href={`/users/new`} />} className="mt-2">
              <UserPlus className="mr-2 size-4" />
              Create User
            </Button>
          )}
        </EmptyState>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const uid = user.userUuid ?? user.publicId
                  return (
                  <TableRow
                    key={uid}
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/users/${uid}`
                      )
                    }
                  >
                    <TableCell className="font-mono text-sm">
                      {user.username}
                    </TableCell>
                    <TableCell className="font-medium">
                      {user.displayName}
                    </TableCell>
                    <TableCell>{user.email ?? "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={user.status} />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          onClick={(e) => e.stopPropagation()}
                          className="cursor-pointer"
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/users/${uid}`)
                            }}
                          >
                            <Eye className="mr-2 size-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/users/${uid}/edit`)
                            }}
                          >
                            <Edit className="mr-2 size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              setStatusToggle({
                                userUuid: uid,
                                currentStatus: user.status,
                              })
                            }}
                          >
                            {user.status === "ACTIVE" ? (
                              <>
                                <ToggleLeft className="mr-2 size-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <ToggleRight className="mr-2 size-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!statusToggle}
        onOpenChange={(open) => !open && setStatusToggle(null)}
        title={
          statusToggle?.currentStatus === "ACTIVE"
            ? "Deactivate User?"
            : "Activate User?"
        }
        description={
          statusToggle?.currentStatus === "ACTIVE"
            ? "This user will no longer be able to log in."
            : "This user will be able to log in again."
        }
        confirmLabel={
          statusToggle?.currentStatus === "ACTIVE" ? "Deactivate" : "Activate"
        }
        variant="destructive"
        isLoading={updateStatusMutation.isPending}
        onConfirm={() => {
          if (!statusToggle) return
          updateStatusMutation.mutate(
            {
              userUuid: statusToggle.userUuid,
              input: {
                status:
                  statusToggle.currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE",
              },
            },
            {
              onSuccess: () => {
                toast.success(
                  `User ${
                    statusToggle.currentStatus === "ACTIVE"
                      ? "deactivated"
                      : "activated"
                  } successfully`
                )
                setStatusToggle(null)
              },
              onError: (error) => {
                toast.error(
                  getApiErrorMessage(error, "Failed to update user status")
                )
              },
            }
          )
        }}
      />
    </div>
  )
}
