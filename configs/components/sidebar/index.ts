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
  FileCheck,
  Settings,
  ShieldAlert,
} from "lucide-react"

export const mainNav: MainNav = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Companies",
    url: "/companies",
    icon: Building2,
  },
  {
    title: "Organization",
    url: "#",
    icon: Users,
    items: [
      {
        title: "Users",
        url: "/companies/current/users",
        icon: UserCog,
      },
      {
        title: "Employees",
        url: "/companies/current/employees",
        icon: Briefcase,
      },
      {
        title: "Designations",
        url: "/companies/current/designations",
        icon: ShieldCheck,
      },
      {
        title: "Geographies",
        url: "/companies/current/geographies",
        icon: MapPin,
      },
    ],
  },
  {
    title: "Access Management",
    url: "#",
    icon: Lock,
    items: [
      {
        title: "Roles",
        url: "/companies/current/roles",
        icon: Shield,
      },
      {
        title: "Permission Sets",
        url: "/companies/current/permission-sets",
        icon: KeyRound,
      },
      {
        title: "Permissions",
        url: "/permissions",
        icon: FileCheck,
      },
      {
        title: "Permission Matrix",
        url: "/permissions/matrix",
        icon: ShieldCheck,
      },
    ],
  },
  {
    title: "Administration",
    url: "#",
    icon: Settings,
    items: [
      {
        title: "Feature Management",
        url: "/companies/current/features",
        icon: Settings,
      },
      {
        title: "RBAC Audit",
        url: "/companies/current/audit/rbac",
        icon: ShieldAlert,
      },
    ],
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
