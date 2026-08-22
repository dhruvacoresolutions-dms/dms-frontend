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
import { useEmployee } from "@/features/employees/hooks/use-employee"
import { EmployeeGeographiesTab } from "@/features/employees/components/EmployeeGeographiesTab"

export default function EmployeeDetailPage() {
  const params = useParams<{ companyUuid: string; employeeUuid: string }>()
  const companyUuid = params.companyUuid
  const employeeUuid = params.employeeUuid
  const { data: employee, isLoading, error, refetch } = useEmployee(companyUuid, employeeUuid)

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState onRetry={refetch} />
  if (!employee) return <ErrorState message="Employee not found" />

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title={`${employee.firstName} ${employee.lastName}`}
        description={`Code: ${employee.employeeCode}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" nativeButton={false} render={<Link href={`/companies/${companyUuid}/employees`} />}>
              <ArrowLeft className="mr-2 size-4" /> Back
            </Button>
            <Button nativeButton={false} render={<Link href={`/companies/${companyUuid}/employees/${employeeUuid}/edit`} />}>
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
          <div className="rounded-lg border p-6 space-y-3">
            <h3 className="text-lg font-semibold">Employee Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">UUID</span><span className="font-mono">{employee.employeeUuid}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Code</span><span className="font-mono">{employee.employeeCode}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span>{employee.firstName} {employee.lastName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{employee.email}</span></div>
              {employee.phone && <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{employee.phone}</span></div>}
              {employee.designationName && <div className="flex justify-between"><span className="text-muted-foreground">Designation</span><span>{employee.designationName}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={employee.status} /></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span>{new Date(employee.createdAt).toLocaleDateString()}</span></div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="geographies">
          <EmployeeGeographiesTab companyUuid={companyUuid} employeeUuid={employeeUuid} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
