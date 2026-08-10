import Image from "next/image"

import { ThemeSwitcher } from "@/components/theme-switcher"

export function AuthSplitLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid h-svh grid-cols-1 lg:grid-cols-2">
      <div className="absolute right-4 top-4 z-10">
        <ThemeSwitcher />
      </div>
      <div className="relative hidden bg-muted lg:block">
        <Image
          src="/images/login-banner.webp"
          alt="Image"
          fill
          priority
          className="h-auto w-full object-contain"
        />
      </div>
      <div className="flex h-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}