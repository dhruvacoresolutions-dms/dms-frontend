import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const SESSION_COOKIE = "session"

const protectedRoutes = [
  "/dashboard",
  "/companies",
  "/permissions",
  "/profile",
  "/users",
  "/employees",
  "/roles",
  "/permission-sets",
  "/departments",
  "/designations",
  "/geographies",
  "/products",
  "/product-categories",
  "/product-uoms",
  "/product-brands",
  "/gst-hsn",
  "/gst-tax-codes",
  "/suppliers",
  "/distributors",
  "/distributor-references",
  "/company-calendar",
  "/vehicle-masters",
  "/support-masters",
  "/product-attributes",
  "/audit",
  "/forbidden",
]
const authRoutes = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/change-password",
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
    // Fresh login every time: never resume the page the user left off.
    return NextResponse.redirect(new URL("/login", request.nextUrl))
  }

  if (isAuthRoute && isAuthenticated && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
}
