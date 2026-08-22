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
          <button onClick={() => handleDelete(product.id)}>Delete</button>
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
