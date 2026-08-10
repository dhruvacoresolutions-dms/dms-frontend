import { redirect } from "next/navigation"

export default async function Page() {
  const isLoggedIn = false // Replace with your authentication logic

  if (isLoggedIn) {
    redirect("/dashboard")
  }

  redirect("/auth/login")
}
