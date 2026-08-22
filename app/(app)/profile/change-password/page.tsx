"use client"

import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm"
import { PageHeader } from "@/components/common/PageHeader"

export default function ChangePasswordPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader title="Change Password" description="Update your account password" />
      <div className="max-w-md">
        <ChangePasswordForm />
      </div>
    </div>
  )
}