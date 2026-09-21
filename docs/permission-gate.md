# Permission Gate System

Frontend UI gating for role/permission-based access. The backend
(`GET /api/v1/me/access`) is the source of truth for authorization; everything
here controls **visibility and access guidance only** — hiding or disabling UI
never replaces backend enforcement.

## How it works

```text
Login → session → GET /me/access → normalizeMyAccess()
 → useAccessStore (access + accessStatus + permissionsSet)
 → usePermission() / <PermissionGate> / <RouteGate> / sidebar filter
 → UI (render / hide / disable / <ForbiddenState>)
```

- Access is fetched once after login (`components/auth/LoginForm.tsx`) and
  rehydrated on refresh by `AppBootstrap`, cached in TanStack Query
  (`authKeys.access`, `staleTime: Infinity`).
- Granted codes are normalized once per payload into a `Set` (separator- and
  case-insensitive: `USER.VIEW` ≡ `USER_VIEW`), so all checks are O(1).
- Developer-facing `EDIT` maps to the backend verb `UPDATE` in exactly one
  place (`ACTION_ALIASES`).

## Usage

### Page protection

```tsx
import { RouteGate } from "@/components/auth/RouteGate"
import { PERMISSIONS } from "@/lib/permissions"

export default function UsersPage() {
  return (
    <RouteGate permission={PERMISSIONS.USER.VIEW}>
      <UsersContent />
    </RouteGate>
  )
}
```

Split pages with data hooks into `*Content` components (or wrap the returned
JSX) so denied users never trigger the query. While access loads, a loader is
shown — never a forbidden flash. If the access fetch itself failed, the gate
fails open (renders children) per the app's "don't lock the user out" policy.

### Action protection

```tsx
import { PermissionGate } from "@/components/auth/PermissionGate"

// Single code (dot or underscore form both work)
<PermissionGate permission="USER.CREATE">
  <CreateUserButton />
</PermissionGate>

// Module + action form (EDIT auto-maps to backend UPDATE)
<PermissionGate module="USER" action="CREATE">
  <CreateUserButton />
</PermissionGate>

// Multiple codes: ANY (default) or ALL
<PermissionGate permissions={["USER.UPDATE", "USER_STATUS"]} require="any">
  <BulkActions />
</PermissionGate>

// Visible-but-disabled instead of hidden (single element or render-prop child)
<PermissionGate permission="USER_EXPORT" mode="disabled" disabledReason="No export right">
  <Button>Export</Button>
</PermissionGate>
<PermissionGate permission="USER_EXPORT" mode="disabled">
  {(allowed) => <Button disabled={!allowed}>Export</Button>}
</PermissionGate>
```

Works for buttons, row/dropdown menu items, dialogs, tabs, and bulk actions.
`fallback` / `loadingFallback` props cover the denied / loading states.

### Hook

```tsx
import { usePermission } from "@/hooks/use-permission"

const { can, canAny, canAll, has, isLoaded } = usePermission()
if (can("USER", "DELETE")) …
disabled={!can("USER", "EXPORT")}
```

`useIsAllowed({ permission?, permissions?, module?, action?, require? })`
(from the same module) is the shared boolean used by both gate components.

### Sidebar / navigation

Add `permission` (or `permissions` + `requireAll`) to any item in
`configs/components/sidebar/index.ts` using the `PERMISSIONS` catalog:

```ts
{ title: "Users", url: "/users", icon: UserCog, permission: PERMISSIONS.USER.VIEW }
```

`AppSidebar` and `TopNavBar` filter automatically: inaccessible items are
**hidden**, parents/groups left empty are pruned. While access loads the nav
renders empty (the shell is behind a loader); on access-fetch failure the full
nav renders (fail open).

## Permission catalog

`PERMISSIONS` (`lib/permissions/permissions.ts`) holds the exact backend codes
— always import from there, never hardcode strings:

| Module | Key | Codes |
|---|---|---|
| `DASHBOARD` | `VIEW` | `DASHBOARD_VIEW` |
| `USER` | `VIEW/CREATE/UPDATE/DELETE/STATUS` | `USER_*` |
| `EMPLOYEE` | `VIEW/CREATE/UPDATE/EXPORT/IMPORT/GEOGRAPHY_IMPORT/LOGIN_MANAGE` | `EMPLOYEE_*` |
| `ROLE` | `VIEW/CREATE/UPDATE/DELETE/ASSIGN/PERMISSION_ASSIGN` | `ROLE_*` |
| `PERMISSION_SET` | `VIEW/CREATE/UPDATE/DELETE/ASSIGN` | `PERMISSION_SET_*` |
| `PERMISSION` | `VIEW` | `PERMISSION_VIEW` |
| `ACCESS_ASSIGNMENT` | `VIEW/CREATE/DELETE` | `ACCESS_ASSIGNMENT_*` |
| `COMPANY` | `PROFILE_VIEW/PROFILE_UPDATE/EXPORT` | `COMPANY_*` |
| `DEPARTMENT` / `DESIGNATION` | `VIEW/CREATE/UPDATE/EXPORT/IMPORT` | `DEPARTMENT_*` / `DESIGNATION_*` |
| `GEOGRAPHY` | `VIEW/CREATE/UPDATE/DELETE/ASSIGN/EXPORT/IMPORT` | `GEOGRAPHY_*` |
| `PRODUCT` | `VIEW/CREATE/UPDATE/EXPORT/IMPORT/SUPPORTING_MASTER_*` | `PRODUCT_*` |
| `INTEGRATION` / `FILE` | `VIEW/MANAGE`, `IMPORT_DOWNLOAD` | `INTEGRATION_*`, `IMPORT_FILE_DOWNLOAD` |

Judgment calls (upgrade to dedicated codes if the backend adds them):
status toggles for employee/department/designation/geography are gated on
`*_UPDATE` (only `USER_STATUS` exists); permission-set "Manage Permissions"
pages use `PERMISSION_SET_UPDATE` (no assign-specific code exists, unlike
`ROLE_PERMISSION_ASSIGN`).

## Adding gates to a new module

1. Confirm the backend codes; add a table to `PERMISSIONS` if missing.
2. List page: `RouteGate(<MODULE>.VIEW)` + gate Create (`CREATE`), row
   Edit (`UPDATE`), Delete (`DELETE`), status, import/export, bulk actions.
3. Sub-pages: `new` → `CREATE`, detail → `VIEW`, `edit` → `UPDATE`
   (assign-style pages → the relevant `*_ASSIGN` code).
4. Sidebar: add `permission` to the nav item(s).
5. After grant/revoke mutations, call `refreshCurrentAccess()` (from
   `features/auth/api/auth.api.ts`) so the session picks up changes without
   re-login.

## Files

| File | Purpose |
|---|---|
| `lib/permissions/permissions.ts` | Catalog, normalizer, `EDIT`→`UPDATE` aliases |
| `lib/permissions/checker.ts` | Pure Set-backed checker (unit-tested, no React) |
| `lib/permissions/nav-filter.ts` | Pure nav filtering |
| `hooks/use-permission.ts` | `usePermission()` + `useIsAllowed()` |
| `hooks/use-filtered-nav.ts` | Filtered `mainNav` / `navGroups` |
| `components/auth/PermissionGate.tsx` | Element/action wrapper (`hidden`/`disabled`) |
| `components/auth/RouteGate.tsx` | Page guard (loader → content / `ForbiddenState`) |
| `components/common/ForbiddenState.tsx` | Reusable 403 UI (built on `EmptyState`) |
| `app/(app)/forbidden/page.tsx` | Routable 403 target |
| `stores/access-store.ts` | `access` + `accessStatus` + derived `permissionsSet` |

## Behavior notes

- Gates render `null` while `accessStatus` is `idle`/`loading` — forbidden UI
  only ever renders for a decided denial.
- Deny-by-default: no requirement specified, empty grants, or unknown codes
  all deny (dev-only console warning for missing requirements).
- No wildcard/super-admin bypass in v1; the existing
  `PLATFORM_ADMINISTRATOR` shell split is unchanged.
- `scopes` / `permissionSets` are stored but not enforced (reserved for
  future scoped checks, e.g. geography).
- Out of scope (deliberate): companies pages (admin role guard covers),
  `audit/rbac` (backend code pending), profile pages (own data).

## Tests

`npm test` (vitest + Testing Library): checker/normalizer/alias unit table,
nav-filter pruning, gate hidden/disabled/render-prop/loading/fail-open paths,
`RouteGate` allowed/denied/loading states — 29 tests.
