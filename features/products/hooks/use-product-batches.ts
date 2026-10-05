"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  getProductBatches,
  createProductBatch,
  updateProductBatch,
  updateProductBatchStatus,
} from "../api/product-subresources.api"
import { productKeys } from "../api/product-keys"
import type {
  CreateProductBatchRequest,
  UpdateProductBatchRequest,
  UpdateProductBatchStatusRequest,
  ProductPriceListParams,
} from "../api/product.types"

export function useProductBatches(
  companyUuid: string,
  productUuid: string,
  params?: ProductPriceListParams
) {
  return useQuery({
    queryKey: productKeys.batchList(companyUuid, productUuid, params),
    queryFn: () => getProductBatches(companyUuid, productUuid, params),
    enabled: !!companyUuid && !!productUuid,
  })
}

function invalidateBatches(
  queryClient: ReturnType<typeof useQueryClient>,
  companyUuid: string,
  productUuid: string
) {
  queryClient.invalidateQueries({
    queryKey: productKeys.batches(companyUuid, productUuid),
  })
}

export function useCreateProductBatch(
  companyUuid: string,
  productUuid: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProductBatchRequest) =>
      createProductBatch(companyUuid, productUuid, input),
    onSuccess: () => invalidateBatches(queryClient, companyUuid, productUuid),
  })
}

export function useUpdateProductBatch(
  companyUuid: string,
  productUuid: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      batchUuid,
      input,
    }: {
      batchUuid: string
      input: UpdateProductBatchRequest
    }) => updateProductBatch(companyUuid, productUuid, batchUuid, input),
    onSuccess: () => invalidateBatches(queryClient, companyUuid, productUuid),
  })
}

export function useUpdateProductBatchStatus(
  companyUuid: string,
  productUuid: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      batchUuid,
      input,
    }: {
      batchUuid: string
      input: UpdateProductBatchStatusRequest
    }) => updateProductBatchStatus(companyUuid, productUuid, batchUuid, input),
    onSuccess: () => invalidateBatches(queryClient, companyUuid, productUuid),
  })
}
