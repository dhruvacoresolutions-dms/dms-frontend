import SidebarLayout from "@/components/sidebar"

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <SidebarLayout>{children}</SidebarLayout>
}