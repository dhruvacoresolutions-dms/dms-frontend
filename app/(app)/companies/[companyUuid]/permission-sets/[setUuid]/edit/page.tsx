"use client"

import { useParams } from "next/navigation"
import { PageHeader } from "@/components/common/PageHeader"
import { LoadingState } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { usePermissionSet } from "@/features/permission-sets/hooks/use-permission-set"
import { PermissionSetEditForm } from "@/features/permission-sets/components/PermissionSetEditForm"

export default function CompanyEditPermissionSetPage() {
  const params = useParams<{ companyUuid: string; setUuid: string }>()
  const { companyUuid, setUuid } = params
  const { data: set, isLoading, error, refetch } = usePermissionSet(companyUuid, setUuid)

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState onRetry={refetch} />
  if (!set) return <ErrorState message="Permission set not found" />

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Edit Permission Set"
        description={`Editing ${set.name} (${set.code})`}
      />
      <PermissionSetEditForm
        companyUuid={companyUuid}
        setUuid={setUuid}
        set={set}
        onSuccessPath={`/companies/${companyUuid}/permission-sets/${setUuid}`}
      />
    </div>
  )
}
