import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout"
import { LoginForm } from "@/components/auth/LoginForm"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const { redirect } = await searchParams

  return (
    <AuthSplitLayout>
      <LoginForm redirect={redirect} />
    </AuthSplitLayout>
  )
}