import type { MainNav, NavGroup } from "@/types/components/sidebar"
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
  // Primary Management
  Package,
  Truck,
  ArrowDownToLine,
  ShoppingCart,
  Undo2,
  Receipt,
  // Sales Management
  ClipboardList,
  ReceiptText,
  ArrowRightLeft,
  Wallet,
  // Inventory Management
  Warehouse,
  Boxes,
  Recycle,
  PackageOpen,
  SlidersHorizontal,
  // Master Management
  Store,
  Wrench,
  UserPlus,
  Car,
  Bike,
  MapPinned,
  Map as MapIcon,
  MapPinCheck,
  // Financial Management
  CalendarDays,
  BadgePercent,
  Landmark,
  // Reports
  BarChart3,
  DollarSign,
  Database,
  AlertCircle,
  Files,
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

/* ------------------------------------------------------------------ */
/*  Grouped Navigation — Primary / Sales / Inventory / Master / etc   */
/*  Used as SidebarGroupLabel sections + TopNavBar mega-groups        */
/* ------------------------------------------------------------------ */

export const navGroups: NavGroup[] = [
  {
    label: "Primary Management",
    icon: Package,
    items: [
      {
        title: "Company Information",
        url: "/primary/company-information",
        icon: Building2,
      },
      {
        title: "Supplier Information",
        url: "/primary/supplier-information",
        icon: Truck,
      },
      // Example with children like MainNav — use url: "#" for parent and `items: [...]`
      // { title: "Purchase", url: "#", icon: ShoppingCart, items: [
      //   { title: "Purchase Inwards", url: "/primary/purchase-inwards", icon: ArrowDownToLine },
      //   { title: "Purchase Order", url: "/primary/purchase-orders", icon: ShoppingCart },
      // ]},
      {
        title: "Purchase Inwards",
        url: "/primary/purchase-inwards",
        icon: ArrowDownToLine,
      },
      {
        title: "Purchase Order",
        url: "/primary/purchase-orders",
        icon: ShoppingCart,
      },
      {
        title: "Purchase Return",
        url: "/primary/purchase-returns",
        icon: Undo2,
      },
      {
        title: "Credit/Debit Note (Only Supplier)",
        url: "/primary/credit-debit-note-supplier",
        icon: Receipt,
      },
    ],
  },
  {
    label: "Sales Management",
    icon: ShoppingCart,
    items: [
      {
        title: "Order Booking",
        url: "/sales/order-booking",
        icon: ClipboardList,
      },
      { title: "Billing", url: "/sales/billing", icon: ReceiptText },
      {
        title: "Order-to-Billing (O2B)",
        url: "/sales/order-to-billing",
        icon: ArrowRightLeft,
      },
      { title: "Sales Return", url: "/sales/sales-return", icon: Undo2 },
      {
        title: "Credit/Debit Note (Only For Retailer)",
        url: "/sales/credit-debit-note-retailer",
        icon: Receipt,
      },
      {
        title: "Collection Entry",
        url: "/sales/collection-entry",
        icon: Wallet,
      },
    ],
  },
  {
    label: "Inventory Management",
    icon: Warehouse,
    items: [
      {
        title: "Godown/Warehouse",
        url: "/inventory/godown-warehouse",
        icon: Warehouse,
      },
      {
        title: "Batch Transfer",
        url: "/inventory/batch-transfer",
        icon: ArrowRightLeft,
      },
      {
        title: "Salvage Management",
        url: "/inventory/salvage-management",
        icon: Recycle,
      },
      {
        title: "Opening Stock",
        url: "/inventory/opening-stock",
        icon: PackageOpen,
      },
      {
        title: "Stock Adjustment",
        url: "/inventory/stock-adjustment",
        icon: SlidersHorizontal,
      },
      {
        title: "Stock Transfer",
        url: "/inventory/stock-transfer",
        icon: Truck,
      },
    ],
  },
  {
    label: "Master Management",
    icon: Database,
    items: [
      { title: "Retailer Creation", url: "/masters/retailers", icon: Store },
      { title: "Mechanic Creation", url: "/masters/mechanics", icon: Wrench },
      { title: "DSR Creation", url: "/masters/dsrs", icon: UserPlus },
      { title: "Vehicle Creation", url: "/masters/vehicles", icon: Car },
      {
        title: "Delivery Boy Creation",
        url: "/masters/delivery-boys",
        icon: Bike,
      },
      { title: "Route Creation", url: "/masters/routes", icon: MapPinned },
      {
        title: "DSR-Route Mapping",
        url: "/masters/dsr-route-mapping",
        icon: MapIcon,
      },
      {
        title: "DSR Coverage",
        url: "/masters/dsr-coverage",
        icon: MapPinCheck,
      },
    ],
  },
  {
    label: "Financial Management",
    icon: Landmark,
    items: [
      {
        title: "Account Calendar",
        url: "/financial/account-calendar",
        icon: CalendarDays,
      },
      {
        title: "Scheme View",
        url: "/financial/scheme-view",
        icon: BadgePercent,
      },
      {
        title: "Claims Management",
        url: "/financial/claims-management",
        icon: FileCheck,
      },
    ],
  },
  {
    label: "Reports",
    icon: BarChart3,
    items: [
      { title: "Sales Report", url: "/reports/sales", icon: BarChart3 },
      {
        title: "Purchase Report",
        url: "/reports/purchase",
        icon: ShoppingCart,
      },
      { title: "Inventory Report", url: "/reports/inventory", icon: Boxes },
      {
        title: "Financial Report",
        url: "/reports/financial",
        icon: DollarSign,
      },
      {
        title: "Master Data Report",
        url: "/reports/master-data",
        icon: Database,
      },
      {
        title: "Outstanding Report",
        url: "/reports/outstanding",
        icon: AlertCircle,
      },
      { title: "Claims Report", url: "/reports/claims", icon: FileCheck },
      { title: "Scheme Report", url: "/reports/scheme", icon: BadgePercent },
      { title: "Tax / GST Report", url: "/reports/tax-gst", icon: ReceiptText },
      { title: "Other Reports", url: "/reports/others", icon: Files },
    ],
  },
]

const slugify = (value: string) => value.toLowerCase().replace(/\s+/g, "-")

function flattenNavItems(items: MainNav): MainNav {
  return items.flatMap((item) => [item, ...flattenNavItems(item.items ?? [])])
}

const flatGroupItems = navGroups.flatMap((g) => flattenNavItems(g.items))

const allNav = [...companiesNav, ...mainNav, ...flatGroupItems]

function collectNavEntries(items: MainNav): { url: string; title: string }[] {
  return items.flatMap((item) => [
    { url: item.url, title: item.title },
    ...collectNavEntries(item.items ?? []),
  ])
}

const navEntries = collectNavEntries(allNav)

// Also register group labels for breadcrumb fallback
const groupEntries = navGroups.map((g) => ({
  url: `/${slugify(g.label)}`,
  title: g.label,
}))

export const navLabelByUrl = new Map<string, string>(
  [...navEntries, ...groupEntries].flatMap(({ url, title }) => [
    [url, title],
    [`/${slugify(title)}`, title],
  ])
)
