import { redirect } from "next/navigation"

export default async function Page() {
  // const isLoggedIn = (await cookies()).has("session")

  // if (isLoggedIn) {
  redirect("/dashboard")
  // }

  // redirect("/login")
}
