import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm"
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout"

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  return (
    <AuthSplitLayout>
      <ResetPasswordForm token={token ?? ""} />
    </AuthSplitLayout>
  )
}