<!-- BEGIN:feature-architecture-rules -->
# Feature Architecture Reference

## Data Flow

React Component → TanStack Query Hook → Feature API Service → Shared Axios Client → Java Backend

Do NOT call Axios directly inside UI components. Do NOT use Next.js API routes as pass-through proxies for normal CRUD APIs.

## Folder Structure

```
features/<feature-name>/
├── api/
│   ├── <feature>.types.ts      # TypeScript types/interfaces
│   ├── <feature>.api.ts        # Plain API functions (HTTP only)
│   └── <feature>-keys.ts       # Query key factory
├── hooks/
│   ├── use-<plural>.ts         # useQuery for list
│   ├── use-<singular>.ts       # useQuery for single item
│   ├── use-create-<singular>.ts
│   ├── use-update-<singular>.ts
│   └── use-delete-<singular>.ts
└── components/                 # Feature-specific UI components (optional)
```

## API Service Rules (`<feature>.api.ts`)

- Plain functions only — no hooks, no React state, no UI logic
- Import `apiClient` from `@/lib/api-client`
- Import `ApiSuccessResponse` from `@/lib/api/api-error`
- Return typed responses extracted from `ApiSuccessResponse<T>.data`
- Handle HTTP communication only

```ts
import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api/api-error"
import type { Product } from "./product.types"

export async function getProducts(): Promise<Product[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<Product[]>>("/products")
  return data.data
}
```

## Query Key Factory (`<feature>-keys.ts`)

Use `as const`. Create hierarchical keys for easy invalidation. Include params in list keys.

```ts
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) =>
    [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
} as const
```

## Query Hooks

### List Query (`use-<plural>.ts`)

```ts
"use client"
import { useQuery } from "@tanstack/react-query"
import { getProducts } from "../api/product.api"
import { productKeys } from "../api/product-keys"
import type { ProductListParams } from "../api/product.types"

export function useProducts(params?: ProductListParams) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => getProducts(params),
  })
}
```

### Detail Query (`use-<singular>.ts`)

```ts
"use client"
import { useQuery } from "@tanstack/react-query"
import { getProductById } from "../api/product.api"
import { productKeys } from "../api/product-keys"

export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => getProductById(id),
    enabled: !!id,
  })
}
```

### Create Mutation (`use-create-<singular>.ts`)

```ts
"use client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createProduct } from "../api/product.api"
import { productKeys } from "../api/product-keys"
import type { CreateProductInput } from "../api/product.types"

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProductInput) => createProduct(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}
```

### Update Mutation (`use-update-<singular>.ts`)

```ts
"use client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateProduct } from "../api/product.api"
import { productKeys } from "../api/product-keys"
import type { UpdateProductInput } from "../api/product.types"

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductInput }) =>
      updateProduct(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) })
    },
  })
}
```

### Delete Mutation (`use-delete-<singular>.ts`)

```ts
"use client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteProduct } from "../api/product.api"
import { productKeys } from "../api/product-keys"

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}
```

## Invalidation Rules

- Creating a resource → invalidate list queries
- Updating a resource → invalidate list queries + the specific detail query
- Deleting a resource → invalidate list queries

## Component Usage

```ts
"use client"
import { Button } from "@/components/ui/button"
import { useProducts } from "@/features/products/hooks/use-products"
import { useDeleteProduct } from "@/features/products/hooks/use-delete-product"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { toast } from "sonner"

export function ProductList() {
  const { data: products, isLoading } = useProducts()
  const deleteMutation = useDeleteProduct()

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Product deleted"),
      onError: (error) => toast.error(getApiErrorMessage(error, "Delete failed")),
    })
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <ul>
      {products?.map((product) => (
        <li key={product.id}>
          {product.name}
          <Button variant="destructive" size="sm" onClick={() => handleDelete(product.id)}>Delete</Button>
        </li>
      ))}
    </ul>
  )
}
```

## Shared Imports

- `apiClient` from `@/lib/api-client`
- `ApiSuccessResponse`, `ApiErrorResponse`, `getApiError`, `getApiErrorMessage` from `@/lib/api/api-error`
- `createQueryClient` from `@/lib/react-query/query-client`
- Auth session: `useAuthStore` from `@/stores/auth-store`
- Session cookies: `setSessionCookie`, `clearSessionCookie` from `@/lib/session`
<!-- END:feature-architecture-rules -->

<!-- BEGIN:permission-gate-rules -->
# Permission Gate Rules (MANDATORY for every new feature)

Backend `GET /api/v1/me/access` is the authorization source of truth. Frontend gates are UX-only (hide/disable/guidance) — they never replace backend enforcement. Every new page / dialog / action MUST be gated.

## Mandatory imports (never hardcode strings)

- `PERMISSIONS` catalog from `@/lib/permissions` (exact backend codes, e.g. `PERMISSIONS.USER.VIEW`)
- `RouteGate` from `@/components/auth/RouteGate` — page-level guard
- `PermissionGate` from `@/components/auth/PermissionGate` — button / row-action / tab / dialog guard
- `usePermission()` from `@/hooks/use-permission` — only for conditional logic / `disabled` props that can't use a wrapper

If the module's codes are missing from `PERMISSIONS` (`lib/permissions/permissions.ts`), add them FIRST before building UI.

## 1. Page-level gate (required on every route page)

Split into `Page` (gate only) + `*Content` (data hooks + JSX) so denied users never fire queries, and there is never a forbidden flash:

```tsx
"use client"
import { RouteGate } from "@/components/auth/RouteGate"
import { PERMISSIONS } from "@/lib/permissions"

export default function ProductsPage() {
  return (
    <RouteGate permission={PERMISSIONS.PRODUCT.VIEW}>
      <ProductsContent />
    </RouteGate>
  )
}
```

Sub-page mapping: `new` → `CREATE`, detail/`[id]` → `VIEW`, `edit` → `UPDATE`, assign-style pages → the relevant `*_ASSIGN` code (e.g. `ROLE.PERMISSION_ASSIGN`).

## 2. Action-level gates (required wherever required)

Gate every mutating / sensitive action. Standard mapping:

| UI element | Gate with |
|---|---|
| Create button (+ empty-state CTA) | `*.CREATE` |
| Row Edit / Edit tab / Manage dialog | `*.UPDATE` |
| Row Delete | `*.DELETE` |
| Status toggle (Active/Inactive) | `*.STATUS`, or `*.UPDATE` if no STATUS code exists |
| Import / Export buttons | `*.IMPORT` / `*.EXPORT` |
| Assign / permission-manage entry points | `*_ASSIGN` (e.g. `ROLE_PERMISSION_ASSIGN`) |

```tsx
import { PermissionGate } from "@/components/auth/PermissionGate"
import { PERMISSIONS } from "@/lib/permissions"

<PermissionGate permission={PERMISSIONS.PRODUCT.CREATE}>
  <Button>Create Product</Button>
</PermissionGate>

<PermissionGate permission={PERMISSIONS.PRODUCT.UPDATE}>
  <DropdownMenuItem>Edit</DropdownMenuItem>
</PermissionGate>
```

Rules:
- Default `mode="hidden"` (renders `fallback`, default `null`). Use `mode="disabled" + disabledReason` only when the control must stay visible for discoverability (e.g. Export).
- Do NOT re-gate plain "View" links inside a page already guarded by `*.VIEW`.
- `PermissionGate` must wrap each gated `DropdownMenuItem` individually (see `app/(app)/users/page.tsx` pattern), not the whole menu.
- For multi-code cases use `permissions={[...]} require="any"|"all"`. For non-wrapper logic use `const { can } = usePermission()` + `can("MODULE", "ACTION")`.
- Never pass raw strings when a `PERMISSIONS.*` constant exists.

## 3. Sidebar (required for new nav items)

Add `permission: PERMISSIONS.<MODULE>.VIEW` to every new item in `configs/components/sidebar/index.ts`. Nav filters automatically (hidden + empty-parent pruning, fail-open on access-fetch error).

## 4. Post-mutation refresh

After any grant/revoke/assign mutation, call `refreshCurrentAccess()` from `features/auth/api/auth.api.ts` so the session picks up changes without re-login.

## New-module checklist (do all of these)

1. Add backend-confirmed codes to `PERMISSIONS`.
2. List page: `RouteGate(VIEW)` + gates for Create / Edit / Delete / Status / Import / Export / bulk actions.
3. Sub-pages (`new` / detail / `edit` / assign) gated per mapping above.
4. Sidebar item(s) with `permission`.
5. Full details: `docs/permission-gate.md`.

## Behavior notes

- Loading → loader/`loadingFallback`, never forbidden UI. Access-fetch error → fail open (render children); backend still enforces.
- Deny-by-default: missing requirement / empty grants / unknown codes all deny.
<!-- END:permission-gate-rules -->

<!-- BEGIN:base-ui-component-rules -->
# Base UI Component Pairing Rules (MANDATORY)

This project uses `@base-ui/react` for all primitive UI components (`components/ui/*`). Base UI enforces **context pairing**: many "part" components MUST be rendered inside their matching parent/group part, otherwise React throws at runtime (e.g. `Base UI: MenuGroupContext is missing`, `…Context is missing`). These crashes often surface only when a menu/dialog opens, so they are easy to miss in build/typecheck.

## Rule: always pair group/label/indicator parts with their parent

| Part | MUST be used inside |
|---|---|
| `DropdownMenuLabel` / `Menu.GroupLabel` | `DropdownMenuGroup` / `Menu.Group` |
| `DropdownMenuCheckboxItem` indicator | `DropdownMenuCheckboxItem` (auto) — never render `CheckboxItemIndicator` standalone |
| `DropdownMenuRadioItem` indicator | `DropdownMenuRadioItem` (auto) |
| `SelectGroup` / `SelectLabel` | `SelectGroup` |
| `MenubarMenu` / `MenubarTrigger` | `Menubar` |
| `ContextMenuTrigger` items | `ContextMenu` |
| `NavigationMenuList` items | `NavigationMenu` |
| `TabsTrigger` | `TabsList` |
| `AccordionTrigger` / `AccordionContent` | `AccordionItem` → `Accordion` |
| `CollapsibleTrigger` / `CollapsibleContent` | `Collapsible` |
| `DialogTrigger` / `DialogContent` | `Dialog` (Root) |
| `AlertDialog*` parts | `AlertDialog` (Root) |
| `PopoverTrigger` / `PopoverContent` | `Popover` (Root) |
| `TooltipTrigger` / `TooltipContent` | `Tooltip` (Root) |
| `HoverCardTrigger` / `HoverCardContent` | `HoverCard` (Root) |

When composing a dropdown menu with a section header, **always** wrap the label and its items in a group:

```tsx
<DropdownMenuGroup>
  <DropdownMenuLabel>Section</DropdownMenuLabel>
  <DropdownMenuItem>…</DropdownMenuItem>
</DropdownMenuGroup>
```

## Rule: never render a *Label / *GroupLabel outside its group

If you only need a loose label (no grouping), render a plain `<span>`/`<div>` with muted text styling instead of `DropdownMenuLabel`, so no context is required.

## Rule: verify by opening the component

Typecheck and lint will NOT catch missing-context crashes. After adding any Base UI composite, **open it in the browser** (click the trigger) and check the console for "Context is missing" errors before marking the task done. Use the dev server + browser tools when available.

## Rule: prefer the shared wrappers

Use the existing `components/ui/*` wrappers and the shared `RowActionsMenu` component rather than hand-rolling `MenuPrimitive.*` parts, so pairing is handled consistently. If you must use primitives directly, mirror an existing working usage in the codebase.
<!-- END:base-ui-component-rules -->
