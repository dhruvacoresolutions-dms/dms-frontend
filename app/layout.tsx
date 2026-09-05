import { Inter } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { DynamicThemeProvider } from "@/components/theme/dynamic-theme-provider"
import { ThemeInitScript } from "@/components/theme/theme-init-script"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryProvider } from "@/components/providers/query-provider"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Inter({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <head>
        <ThemeInitScript />
      </head>
      <body>
        <QueryProvider>
          <ThemeProvider>
            <DynamicThemeProvider>
              <TooltipProvider>{children}</TooltipProvider>
            </DynamicThemeProvider>
          </ThemeProvider>
          <Toaster richColors />
        </QueryProvider>
      </body>
    </html>
  )
}
