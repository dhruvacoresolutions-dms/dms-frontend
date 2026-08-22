import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AccentThemeProvider } from "@/components/accent-provider"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryProvider } from "@/components/providers/query-provider"
import { Toaster } from "sonner"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
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
        geist.variable
      )}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var a=JSON.parse(localStorage.getItem("dms-accent"));if(a&&a.state&&a.state.accent)document.documentElement.dataset.accent=a.state.accent}catch(e){}`,
          }}
        />
      </head>
      <body>
        <QueryProvider>
          <ThemeProvider>
            <AccentThemeProvider />
            <TooltipProvider>{children}</TooltipProvider>
          </ThemeProvider>
          <Toaster richColors />
        </QueryProvider>
      </body>
    </html>
  )
}
