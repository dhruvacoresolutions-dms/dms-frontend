import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm"
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout"

export default function ChangePasswordPage() {
  return (
    <AuthSplitLayout>
      <ChangePasswordForm />
    </AuthSplitLayout>
  )
}