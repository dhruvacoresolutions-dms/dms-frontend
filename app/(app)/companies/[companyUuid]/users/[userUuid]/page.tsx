"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { Edit, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/common/PageHeader"
import { StatusBadge } from "@/components/common/StatusBadge"
import { LoadingState } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { useUser } from "@/features/users/hooks/use-user"
import { UserAssignmentsSection } from "@/features/users/components/UserAssignmentsSection"
import { UserEffectiveAccessSection } from "@/features/users/components/UserEffectiveAccessSection"

export default function UserDetailPage() {
  const params = useParams<{ companyUuid: string; userUuid: string }>()
  const companyUuid = params.companyUuid
  const userUuid = params.userUuid

  const { data: user, isLoading, error, refetch } = useUser(companyUuid, userUuid)

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState onRetry={refetch} />
  if (!user) return <ErrorState message="User not found" />

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title={user.displayName}
        description={`@${user.username}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" nativeButton={false} render={<Link href={`/companies/${companyUuid}/users`} />}>
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Button>
            <Button nativeButton={false} render={<Link href={`/companies/${companyUuid}/users/${userUuid}/edit`} />}>
              <Edit className="mr-2 size-4" />
              Edit
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="access">Effective Access</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="rounded-lg border p-6 space-y-3">
            <h3 className="text-lg font-semibold">User Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">UUID</span>
                <span className="font-mono">{user.userUuid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Username</span>
                <span className="font-mono">{user.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Display Name</span>
                <span>{user.displayName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span>{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={user.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="assignments">
          <UserAssignmentsSection companyUuid={companyUuid} userUuid={userUuid} />
        </TabsContent>

        <TabsContent value="access">
          <UserEffectiveAccessSection companyUuid={companyUuid} userUuid={userUuid} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
