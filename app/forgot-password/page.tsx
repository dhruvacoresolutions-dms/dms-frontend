import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm"
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout"

export default function ForgotPasswordPage() {
  return (
    <AuthSplitLayout>
      <ForgotPasswordForm />
    </AuthSplitLayout>
  )
}