import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const SESSION_COOKIE = "session"

const protectedRoutes = ["/dashboard"]
const authRoutes = [
  "/auth/login",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/change-password",
]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  const isAuthenticated = request.cookies.has(SESSION_COOKIE)

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/auth/login", request.nextUrl)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute && isAuthenticated && pathname === "/auth/login") {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
}