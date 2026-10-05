"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import {
  UserPlus,
  MoreHorizontal,
  Eye,
  Edit,
  ToggleLeft,
  ToggleRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/common/SearchInput"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/common/StatusBadge"
import { PageHeader } from "@/components/common/PageHeader"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { RouteGate } from "@/components/auth/RouteGate"
import { PERMISSIONS } from "@/lib/permissions"
import { useUsers } from "@/features/users/hooks/use-users"
import type { UserResponse } from "@/features/users/api/user.types"
import { useUpdateUserStatus } from "@/features/users/hooks/use-update-user-status"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"

export default function UsersPage() {
  return (
    <RouteGate permission={PERMISSIONS.USER.VIEW}>
      <UsersContent />
    </RouteGate>
  )
}

function UsersContent() {
  const router = useRouter()
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [statusToggle, setStatusToggle] = useState<{
    userUuid: string
    currentStatus: string
  } | null>(null)

  const { data, isLoading, error, refetch } = useUsers(companyUuid, {
    search: search || undefined,
    page,
    size,
  })

  const updateStatusMutation = useUpdateUserStatus(companyUuid)

  const users = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  const columns = useMemo<DataTableColumn<UserResponse>[]>(
    () => [
      {
        id: "username",
        header: "Username",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.username}</span>
        ),
      },
      {
        id: "displayName",
        header: "Display Name",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.displayName}</span>
        ),
      },
      {
        id: "email",
        header: "Email",
        cell: ({ row }) => row.original.email ?? "—",
      },
      {
        id: "status",
        header: "Login Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const user = row.original
          const uid = user.userUuid ?? user.publicId
          return (
            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer">
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-auto min-w-40"
              >
                <DropdownMenuItem
                  onClick={() => {
                    router.push(`/users/${uid}`)
                  }}
                >
                  <Eye className="mr-2 size-4" />
                  View
                </DropdownMenuItem>
                <PermissionGate permission={PERMISSIONS.USER.UPDATE}>
                  <DropdownMenuItem
                    onClick={() => {
                      router.push(`/users/${uid}/edit`)
                    }}
                  >
                    <Edit className="mr-2 size-4" />
                    Edit
                  </DropdownMenuItem>
                </PermissionGate>
                <PermissionGate permission={PERMISSIONS.USER.STATUS}>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant={
                      user.status === "ACTIVE"
                        ? "destructive"
                        : "default"
                    }
                    onClick={() => {
                      setStatusToggle({
                        userUuid: uid,
                        currentStatus: user.status,
                      })
                    }}
                  >
                    {user.status === "ACTIVE" ? (
                      <>
                        <ToggleLeft className="mr-2 size-4" />{" "}
                        Deactivate
                      </>
                    ) : (
                      <>
                        <ToggleRight className="mr-2 size-4" />{" "}
                        Activate
                      </>
                    )}
                  </DropdownMenuItem>
                </PermissionGate>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [router]
  )

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Users"
        description="Manage company users"
        action={
          <PermissionGate permission={PERMISSIONS.USER.CREATE}>
            <Button nativeButton={false} render={<Link href={`/users/new`} />}>
              <UserPlus className="mr-2 size-4" />
              Create User
            </Button>
          </PermissionGate>
        }
      />

      <div className="flex items-center gap-2">
        <SearchInput
          placeholder="Search users..."
          defaultValue={search}
          onChange={(v) => {
            setSearch(v)
            setPage(0)
          }}
        />
      </div>

      <DataTable
        columns={columns}
        data={users}
        getRowId={(user) => user.userUuid ?? user.publicId}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        empty={{
          icon: UserPlus,
          title: "No users found",
          description: search
            ? "Try a different search term."
            : "Get started by creating a user.",
          action: !search ? (
            <PermissionGate permission={PERMISSIONS.USER.CREATE}>
              <Button nativeButton={false} render={<Link href={`/users/new`} />}>
                <UserPlus className="mr-2 size-4" />
                Create User
              </Button>
            </PermissionGate>
          ) : undefined,
        }}
        pagination={{ page, totalPages, onPageChange: setPage, pageSize: size, onPageSizeChange: (s) => { setSize(s); setPage(0) } }}
      />

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
                  statusToggle.currentStatus === "ACTIVE"
                    ? "INACTIVE"
                    : "ACTIVE",
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
