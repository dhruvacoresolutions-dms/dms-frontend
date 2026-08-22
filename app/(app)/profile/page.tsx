"use client"

import { useAuthStore } from "@/stores/auth-store"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/common/PageHeader"
import { useCurrentAccess } from "@/features/auth/hooks/use-current-access"

export default function ProfilePage() {
  const user = useAuthStore((state) => state.session?.user)
  const { data: access } = useCurrentAccess()

  const displayName = user?.displayName ?? "User"
  const initials = displayName
    .split(" ")
    .map((p) => p.charAt(0))
    .join("")
    .slice(0, 2)

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader title="My Profile" description="View your account information" />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-semibold">{displayName}</p>
                <p className="text-sm text-muted-foreground">@{user?.username}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">User UUID</span>
                <span className="font-mono">{user?.userUuid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Company</span>
                <span>{user?.companyCode ?? "Platform"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Roles</span>
                <span>{user?.roles?.join(", ") ?? "None"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {access && (
          <Card>
            <CardHeader>
              <CardTitle>Access Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Permissions</span>
                  <span>{access.permissions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Roles</span>
                  <span>{access.roles.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Permission Sets</span>
                  <span>{access.permissionSets.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Features</span>
                  <span>{access.enabledFeatures.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}