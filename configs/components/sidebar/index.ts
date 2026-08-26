import type { MainNav } from "@/types/components/sidebar"
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCog,
  Briefcase,
  MapPin,
  Shield,
  KeyRound,
  Lock,
  ShieldCheck,
  Settings,
  ShieldAlert,
} from "lucide-react"

export const companiesNav: MainNav = [
  {
    title: "Companies",
    url: "/companies",
    icon: Building2,
  },
]

export const mainNav: MainNav = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Organization",
    url: "/organization",
    icon: Users,
    items: [
      {
        title: "Users",
        url: "/users",
        icon: UserCog,
      },
      {
        title: "Employees",
        url: "/employees",
        icon: Briefcase,
      },
      {
        title: "Designations",
        url: "/designations",
        icon: ShieldCheck,
      },
      {
        title: "Geographies",
        url: "/geographies",
        icon: MapPin,
      },
    ],
  },
  {
    title: "Access Management",
    url: "/access-management",
    icon: Lock,
    items: [
      {
        title: "Roles",
        url: "/roles",
        icon: Shield,
      },
      {
        title: "Permission Sets",
        url: "/permission-sets",
        icon: KeyRound,
      },

    ],
  },
  {
    title: "Administration",
    url: "/administration",
    icon: Settings,
    items: [
      {
        title: "Feature Management",
        url: "/features",
        icon: Settings,
      },
      {
        title: "RBAC Audit",
        url: "/audit/rbac",
        icon: ShieldAlert,
      },
    ],
  },
]

const slugify = (value: string) => value.toLowerCase().replace(/\s+/g, "-")

const allNav = [...companiesNav, ...mainNav]

const navEntries = allNav.flatMap((item) => [
  { url: item.url, title: item.title },
  ...(item.items?.map((sub) => ({ url: sub.url, title: sub.title })) ?? []),
])

export const navLabelByUrl = new Map<string, string>(
  navEntries.flatMap(({ url, title }) => [
    [url, title],
    [`/${slugify(title)}`, title],
  ])
)
