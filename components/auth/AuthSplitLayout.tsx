import Image from "next/image"

export function AuthSplitLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid h-svh grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden bg-muted lg:block">
        <Image
          src="/images/login-banner.webp"
          alt="Image"
          fill
          priority
          className="h-auto w-full object-contain dark:brightness-[0.2]"
        />
      </div>
      <div className="flex h-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}
