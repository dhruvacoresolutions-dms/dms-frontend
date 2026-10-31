import type { MainNav, NavGroup } from "@/types/components/sidebar"
import { PERMISSIONS } from "@/lib/permissions"
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
  Network,
  ShieldCheck,
  FileCheck,
  ClipboardCheck,
  ShieldAlert,
  Upload,
  // Primary Management
  Package,
  ListTree,
  Ruler,
  Award,
  Tags,
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
  Route,
  UsersRound,
  // Financial Management
  CalendarDays,
  CalendarRange,
  CalendarOff,
  CalendarClock,
  CalendarCheck,
  Settings2,
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

/* ------------------------------------------------------------------ */
/*  Primary navigation                                                 */
/*                                                                     */
/*  Organization / Access Control / Product & Pricing each own a       */
/*  dedicated `Nav*` component (see `components/sidebar/nav-*`) so     */
/*  they can evolve independently — e.g. Organization clubs its         */
/*  Distributor entries into one expanding branch.                     */
/*                                                                     */
/*  `mainNav` holds only the plain top-level items that `NavMain`       */
/*  renders; `primaryNav` composes everything for the top navbar.       */
/* ------------------------------------------------------------------ */

export const organizationNav: MainNav = [
  {
    title: "Users",
    url: "/users",
    icon: UserCog,
    permission: PERMISSIONS.USER.VIEW,
  },
  {
    title: "Employees",
    url: "/employees",
    icon: Briefcase,
    permission: PERMISSIONS.EMPLOYEE.VIEW,
  },
  {
    title: "Designations",
    url: "/designations",
    icon: ShieldCheck,
    permission: PERMISSIONS.DESIGNATION.VIEW,
  },
  {
    title: "Departments",
    url: "/departments",
    icon: Network,
    permission: PERMISSIONS.DEPARTMENT.VIEW,
  },
  {
    title: "Geographies",
    url: "/geographies",
    icon: MapPin,
    permission: PERMISSIONS.GEOGRAPHY.VIEW,
  },
  {
    title: "Suppliers",
    url: "/suppliers",
    icon: Truck,
    permission: PERMISSIONS.SUPPLIER.VIEW,
  },
  {
    title: "Distributors",
    url: "#",
    icon: Store,
    items: [
      {
        title: "Distributor List",
        url: "/distributors",
        icon: Store,
        permission: PERMISSIONS.DISTRIBUTOR.VIEW,
      },
      {
        title: "Distributor References",
        url: "/distributor-references",
        icon: ListTree,
        permission: PERMISSIONS.DISTRIBUTOR.MASTER_VIEW,
      },
    ],
  },
  {
    title: "Customers",
    url: "#",
    icon: UsersRound,
    items: [
      {
        title: "Customer List",
        url: "/customers",
        icon: UsersRound,
        permission: PERMISSIONS.CUSTOMER.VIEW,
      },
      {
        title: "Customer Approvals",
        url: "/customers/approvals",
        icon: ClipboardCheck,
        permission: PERMISSIONS.CUSTOMER.APPROVE,
      },
      {
        title: "Pincode Mappings",
        url: "/customers/pincode-mappings",
        icon: MapPinned,
        permission: PERMISSIONS.CUSTOMER.VIEW,
      },
      {
        title: "Classification Masters",
        url: "/customers/classification-masters",
        icon: ListTree,
        permission: PERMISSIONS.CUSTOMER.VIEW,
      },
    ],
  },
  {
    title: "Master Data Upload",
    url: "/master-data-upload",
    icon: Upload,
    // Visible when ANY master import code is granted; hidden otherwise.
    permissions: [
      PERMISSIONS.EMPLOYEE.IMPORT,
      PERMISSIONS.DEPARTMENT.IMPORT,
      PERMISSIONS.DESIGNATION.IMPORT,
      PERMISSIONS.GEOGRAPHY.IMPORT,
      PERMISSIONS.EMPLOYEE.GEOGRAPHY_IMPORT,
    ],
  },
]

export const accessControlNav: MainNav = [
  {
    title: "Roles",
    url: "/roles",
    icon: Shield,
    permission: PERMISSIONS.ROLE.VIEW,
  },
  {
    title: "Permission Sets",
    url: "/permission-sets",
    icon: KeyRound,
    permission: PERMISSIONS.PERMISSION_SET.VIEW,
  },
  {
    title: "Permissions",
    url: "/permissions",
    icon: FileCheck,
    permission: PERMISSIONS.PERMISSION.VIEW,
  },
  {
    title: "Permission Matrix",
    url: "/permissions/matrix",
    icon: ShieldCheck,
    permission: PERMISSIONS.PERMISSION.VIEW,
  },
  {
    title: "RBAC Audit",
    url: "/audit/rbac",
    icon: ShieldAlert,
    // TODO: picks up its backend code once confirmed; visible meanwhile.
  },
]

export const productPricingNav: MainNav = [
  {
    title: "Products",
    url: "/products",
    icon: Package,
    permission: PERMISSIONS.PRODUCT.VIEW,
  },
  {
    title: "Categories",
    url: "/product-categories",
    icon: ListTree,
    permission: PERMISSIONS.PRODUCT.SUPPORTING_MASTER_VIEW,
  },
  {
    title: "UOMs",
    url: "/product-uoms",
    icon: Ruler,
    permission: PERMISSIONS.PRODUCT.SUPPORTING_MASTER_VIEW,
  },
  {
    title: "Brands",
    url: "/product-brands",
    icon: Award,
    permission: PERMISSIONS.PRODUCT.SUPPORTING_MASTER_VIEW,
  },
  {
    title: "GST HSN",
    url: "/gst-hsn",
    icon: ReceiptText,
    permission: PERMISSIONS.PRODUCT.SUPPORTING_MASTER_VIEW,
  },
  {
    title: "Tax Codes",
    url: "/gst-tax-codes",
    icon: Landmark,
    permission: PERMISSIONS.PRODUCT.SUPPORTING_MASTER_VIEW,
  },
  {
    title: "Vehicle Masters",
    url: "/vehicle-masters",
    icon: Car,
    permission: PERMISSIONS.PRODUCT.SUPPORTING_MASTER_VIEW,
  },
  {
    title: "Support Masters",
    url: "/support-masters",
    icon: Wrench,
    permission: PERMISSIONS.PRODUCT.SUPPORTING_MASTER_VIEW,
  },
  {
    title: "Attributes",
    url: "/product-attributes",
    icon: Tags,
    permission: PERMISSIONS.PRODUCT.SUPPORTING_MASTER_VIEW,
  },
]

/**
 * Company Calendar module: fiscal years / accounting periods, holidays,
 * weekly-off rules, the effective calendar and visit/claim settings.
 */
export const companyCalendarNav: MainNav = [
  {
    title: "Fiscal Years",
    url: "/company-calendar/fiscal-years",
    icon: CalendarRange,
    permission: PERMISSIONS.COMPANY_CALENDAR.VIEW,
  },
  {
    title: "Holidays",
    url: "/company-calendar/holidays",
    icon: CalendarOff,
    permission: PERMISSIONS.COMPANY_CALENDAR.VIEW,
  },
  {
    title: "Weekly Off Rule",
    url: "/company-calendar/weekly-off",
    icon: CalendarClock,
    permission: PERMISSIONS.COMPANY_CALENDAR.VIEW,
  },
  {
    title: "Effective Calendar",
    url: "/company-calendar/effective",
    icon: CalendarCheck,
    permission: PERMISSIONS.COMPANY_CALENDAR.VIEW,
  },
  {
    title: "Calendar Settings",
    url: "/company-calendar/settings",
    icon: Settings2,
    // Visible when either visit-radius or claim-policy read access is granted.
    permissions: [PERMISSIONS.VISIT_RADIUS.VIEW, PERMISSIONS.CLAIM_POLICY.VIEW],
  },
]

/** Plain top-level items rendered by `NavMain` in the sidebar. */
export const mainNav: MainNav = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    permission: PERMISSIONS.DASHBOARD.VIEW,
  },
]

/** Sales Force Automation — visit planning and field-sales execution. */
export const sfaNav: MainNav = [
  {
    title: "Visit Plans",
    url: "/visit-plans",
    icon: MapPinCheck,
    permission: PERMISSIONS.VISIT_PLAN.VIEW,
  },
  {
    title: "Coverage Plans",
    url: "/coverage-plans",
    icon: CalendarRange,
    permission: PERMISSIONS.COVERAGE_PLAN.VIEW,
  },
]

/** Flatten nested branches to leaf items (the top navbar has no depth). */
function flattenNav(items: MainNav): MainNav {
  return items.flatMap((item) => {
    if (item.items?.length) return flattenNav(item.items)
    if (item.url === "#") return []
    return [item]
  })
}

/** Leaves + the three groups, consumed by the top navigation bar. */
export const primaryNav: MainNav = [
  ...mainNav,
  {
    title: "SFA",
    url: "#",
    icon: Route,
    items: flattenNav(sfaNav),
  },
  {
    title: "Organization",
    url: "#",
    icon: Users,
    items: flattenNav(organizationNav),
  },
  {
    title: "Access Control",
    url: "#",
    icon: Lock,
    items: accessControlNav,
  },
  {
    title: "Product & Pricing",
    url: "#",
    icon: Package,
    items: productPricingNav,
  },
]

/* ------------------------------------------------------------------ */
/*  Grouped Navigation — Primary / Sales / Inventory / Master / etc   */
/*  Used as SidebarGroupLabel sections + TopNavBar mega-groups        */
/* ------------------------------------------------------------------ */

export const navGroups: NavGroup[] = [
  {
    label: "Product & Pricing",
    icon: Package,
    items: [
      {
        title: "Products",
        url: "/products",
        icon: Package,
        permission: PERMISSIONS.PRODUCT.VIEW,
      },
      {
        title: "Categories",
        url: "/product-categories",
        icon: ListTree,
        permission: PERMISSIONS.PRODUCT.SUPPORTING_MASTER_VIEW,
      },
      {
        title: "UOMs",
        url: "/product-uoms",
        icon: Ruler,
        permission: PERMISSIONS.PRODUCT.SUPPORTING_MASTER_VIEW,
      },
      {
        title: "Brands",
        url: "/product-brands",
        icon: Award,
        permission: PERMISSIONS.PRODUCT.SUPPORTING_MASTER_VIEW,
      },
      {
        title: "GST HSN",
        url: "/gst-hsn",
        icon: ReceiptText,
        permission: PERMISSIONS.PRODUCT.SUPPORTING_MASTER_VIEW,
      },
      {
        title: "Tax Codes",
        url: "/gst-tax-codes",
        icon: Landmark,
        permission: PERMISSIONS.PRODUCT.SUPPORTING_MASTER_VIEW,
      },
      {
        title: "Vehicle Masters",
        url: "/vehicle-masters",
        icon: Car,
        permission: PERMISSIONS.PRODUCT.SUPPORTING_MASTER_VIEW,
      },
      {
        title: "Support Masters",
        url: "/support-masters",
        icon: Wrench,
        permission: PERMISSIONS.PRODUCT.SUPPORTING_MASTER_VIEW,
      },
      {
        title: "Attributes",
        url: "/product-attributes",
        icon: Tags,
        permission: PERMISSIONS.PRODUCT.SUPPORTING_MASTER_VIEW,
      },
    ],
  },
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
    label: "Company Calendar",
    icon: CalendarDays,
    items: [...companyCalendarNav],
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

const allNav = [
  ...companiesNav,
  ...mainNav,
  ...organizationNav,
  ...accessControlNav,
  ...productPricingNav,
  ...companyCalendarNav,
  ...sfaNav,
  ...flatGroupItems,
]

function collectNavEntries(items: MainNav): { url: string; title: string }[] {
  return items.flatMap((item) => [
    { url: item.url, title: item.title },
    ...collectNavEntries(item.items ?? []),
  ])
}

const navEntries = collectNavEntries(allNav)

// Also register group labels for breadcrumb fallback
const groupEntries = [
  ...navGroups.map((g) => ({
    url: `/${slugify(g.label)}`,
    title: g.label,
  })),
  { url: "/organization", title: "Organization" },
  { url: "/access-management", title: "Access Control" },
  { url: "/product-pricing", title: "Product & Pricing" },
]

export const navLabelByUrl = new Map<string, string>(
  [...navEntries, ...groupEntries].flatMap(({ url, title }) => [
    [url, title],
    [`/${slugify(title)}`, title],
  ])
)
