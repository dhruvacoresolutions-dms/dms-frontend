import type { CustomerMasterKind } from "../api/customer.types"

export type CustomerMasterConfig = {
  kind: CustomerMasterKind
  label: string
  singular: string
  description: string
  /** Sub-types must belong to a customer type. */
  requiresCustomerType?: boolean
  /** Channels and groups form a hierarchy and accept a parent. */
  allowsParent?: boolean
  /** Classes carry a numeric rank. */
  hasRankLevel?: boolean
  /** Lookups are grouped by lookup type. */
  requiresLookupType?: boolean
}

export const CUSTOMER_MASTER_CONFIGS: CustomerMasterConfig[] = [
  {
    kind: "customer-sub-types",
    label: "Sub Types",
    singular: "Sub Type",
    description: "Outlet sub-classifications scoped to a customer type.",
    requiresCustomerType: true,
  },
  {
    kind: "customer-channels",
    label: "Channels",
    singular: "Channel",
    description: "Sales channels, optionally organised as a hierarchy.",
    allowsParent: true,
  },
  {
    kind: "customer-segments",
    label: "Segments",
    singular: "Segment",
    description: "Commercial segments used for targeting and pricing.",
  },
  {
    kind: "customer-categories",
    label: "Categories",
    singular: "Category",
    description: "Outlet categories used in coverage and reporting.",
  },
  {
    kind: "customer-classes",
    label: "Classes",
    singular: "Class",
    description: "Ranked outlet classes (for example A/B/C).",
    hasRankLevel: true,
  },
  {
    kind: "customer-groups",
    label: "Groups",
    singular: "Group",
    description: "Buying or operational groups, optionally hierarchical.",
    allowsParent: true,
  },
  {
    kind: "customer-lookups",
    label: "Lookups",
    singular: "Lookup",
    description:
      "Business type, shop size, monthly potential, language and KYC document types.",
    requiresLookupType: true,
  },
]

export function customerMasterConfig(kind: CustomerMasterKind) {
  return CUSTOMER_MASTER_CONFIGS.find((c) => c.kind === kind)
}
