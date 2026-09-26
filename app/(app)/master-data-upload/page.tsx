"use client"

import * as React from "react"
import { useAuthStore } from "@/stores/auth-store"
import { PageHeader } from "@/components/common/PageHeader"
import { RouteGate } from "@/components/auth/RouteGate"
import { UploadWizard } from "@/features/master-data-upload/components/UploadWizard"
import { UploadHistory } from "@/features/master-data-upload/components/UploadHistory"
import { TemplateDownloadDropdown } from "@/features/master-data-upload/components/TemplateDownloadDropdown"
import { MASTER_DATA_UPLOAD_PERMISSIONS } from "@/features/master-data-upload/api/master-data-upload.api"
import type { MasterDataType } from "@/features/master-data-upload/api/master-data-upload.types"

export default function MasterDataUploadPage() {
  return (
    <RouteGate permissions={[...MASTER_DATA_UPLOAD_PERMISSIONS]} require="any">
      <MasterDataUploadContent />
    </RouteGate>
  )
}

function MasterDataUploadContent() {
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  // First master type (Employee) selected by default.
  const [masterType, setMasterType] = React.useState<MasterDataType>("employee")

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Master Data Upload"
        description="Upload and manage all master data for your organization."
        action={<TemplateDownloadDropdown companyUuid={companyUuid} />}
      />

      <UploadWizard
        key={`wizard:${companyUuid}:${masterType}`}
        companyUuid={companyUuid}
        type={masterType}
        onTypeChange={setMasterType}
      />

      <UploadHistory
        key={`history:${companyUuid}:${masterType}`}
        companyUuid={companyUuid}
        type={masterType}
      />
    </div>
  )
}
