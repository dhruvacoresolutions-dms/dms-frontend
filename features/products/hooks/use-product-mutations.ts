"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  createProduct,
  updateProduct,
  publishProduct,
  deactivateProduct,
  reactivateProduct,
} from "../api/product.api"
import { productKeys } from "../api/product-keys"
import type {
  CreateProductRequest,
  UpdateProductRequest,
  ProductLifecycleRequest,
} from "../api/product.types"

export function useCreateProduct(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProductRequest) =>
      createProduct(companyUuid, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: productKeys.lists(companyUuid),
      })
    },
  })
}

export function useUpdateProduct(companyUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      productUuid,
      input,
    }: {
      productUuid: string
      input: UpdateProductRequest
    }) => updateProduct(companyUuid, productUuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.lists(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(companyUuid, variables.productUuid),
      })
    },
  })
}

function useLifecycleMutation(
  companyUuid: string,
  fn: (
    companyUuid: string,
    productUuid: string,
    input: ProductLifecycleRequest
  ) => Promise<unknown>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      productUuid,
      input,
    }: {
      productUuid: string
      input: ProductLifecycleRequest
    }) => fn(companyUuid, productUuid, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.lists(companyUuid),
      })
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(companyUuid, variables.productUuid),
      })
    },
  })
}

export function usePublishProduct(companyUuid: string) {
  return useLifecycleMutation(companyUuid, publishProduct)
}

export function useDeactivateProduct(companyUuid: string) {
  return useLifecycleMutation(companyUuid, deactivateProduct)
}

export function useReactivateProduct(companyUuid: string) {
  return useLifecycleMutation(companyUuid, reactivateProduct)
}
