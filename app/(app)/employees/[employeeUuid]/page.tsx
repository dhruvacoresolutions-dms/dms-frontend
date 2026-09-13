"use client"

import { useParams } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import Link from "next/link"
import { Edit, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/common/PageHeader"
import { LoadingState } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { useEmployee } from "@/features/employees/hooks/use-employee"
import { EmployeeOverview } from "@/features/employees/components/EmployeeOverview"
import { EmployeeGeographiesTab } from "@/features/employees/components/EmployeeGeographiesTab"

export default function EmployeeDetailPage() {
  const params = useParams<{ employeeUuid: string }>()
  const companyUuid = useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const employeeUuid = params.employeeUuid
  const { data: employee, isLoading, error, refetch } = useEmployee(companyUuid, employeeUuid)

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState onRetry={refetch} />
  if (!employee) return <ErrorState message="Employee not found" />

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title={employee.fullName ?? `${employee.firstName} ${employee.lastName}`}
        description={`Code: ${employee.employeeCode}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" nativeButton={false} render={<Link href={`/employees`} />}>
              <ArrowLeft className="mr-2 size-4" /> Back
            </Button>
            <Button nativeButton={false} render={<Link href={`/employees/${employeeUuid}/edit`} />}>
              <Edit className="mr-2 size-4" /> Edit
            </Button>
          </div>
        }
      />
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="geographies">Geographies</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <EmployeeOverview employee={employee} />
        </TabsContent>
        <TabsContent value="geographies">
          <EmployeeGeographiesTab companyUuid={companyUuid} employeeUuid={employeeUuid} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
