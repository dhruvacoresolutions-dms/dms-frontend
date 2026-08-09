import type { MainNav } from "@/types/components/sidebar"
import { LayoutDashboard } from "lucide-react"

export const mainNav: MainNav = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    isActive: true,
  },
]

const slugify = (value: string) => value.toLowerCase().replace(/\s+/g, "-")

const navEntries = mainNav.flatMap((item) => [
  { url: item.url, title: item.title },
  ...(item.items?.map((sub) => ({ url: sub.url, title: sub.title })) ?? []),
])

export const navLabelByUrl = new Map<string, string>(
  navEntries.flatMap(({ url, title }) => [
    [url, title],
    [`/${slugify(title)}`, title],
  ])
)
