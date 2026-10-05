"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  getPriceTypes,
  getProductPrices,
  getCurrentProductPrices,
  createProductPrice,
  reviseProductPrice,
  updateProductPrice,
  deactivateProductPrice,
} from "../api/product-subresources.api"
import { productKeys } from "../api/product-keys"
import type {
  CreateProductPriceRequest,
  ReviseProductPriceRequest,
  UpdateProductPriceRequest,
  DeactivateProductPriceRequest,
  ProductPriceListParams,
} from "../api/product.types"

export function usePriceTypes(companyUuid: string) {
  return useQuery({
    queryKey: productKeys.priceTypes(companyUuid),
    queryFn: () => getPriceTypes(companyUuid),
    enabled: !!companyUuid,
  })
}

export function useProductPrices(
  companyUuid: string,
  productUuid: string,
  params?: ProductPriceListParams
) {
  return useQuery({
    queryKey: productKeys.priceList(companyUuid, productUuid, params),
    queryFn: () => getProductPrices(companyUuid, productUuid, params),
    enabled: !!companyUuid && !!productUuid,
  })
}

export function useCurrentProductPrices(
  companyUuid: string,
  productUuid: string
) {
  return useQuery({
    queryKey: [...productKeys.prices(companyUuid, productUuid), "current"],
    queryFn: () => getCurrentProductPrices(companyUuid, productUuid),
    enabled: !!companyUuid && !!productUuid,
  })
}

function invalidatePrices(
  queryClient: ReturnType<typeof useQueryClient>,
  companyUuid: string,
  productUuid: string
) {
  queryClient.invalidateQueries({
    queryKey: productKeys.prices(companyUuid, productUuid),
  })
}

export function useCreateProductPrice(
  companyUuid: string,
  productUuid: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProductPriceRequest) =>
      createProductPrice(companyUuid, productUuid, input),
    onSuccess: () => invalidatePrices(queryClient, companyUuid, productUuid),
  })
}

export function useReviseProductPrice(
  companyUuid: string,
  productUuid: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      priceUuid,
      input,
    }: {
      priceUuid: string
      input: ReviseProductPriceRequest
    }) => reviseProductPrice(companyUuid, productUuid, priceUuid, input),
    onSuccess: () => invalidatePrices(queryClient, companyUuid, productUuid),
  })
}

export function useUpdateProductPrice(
  companyUuid: string,
  productUuid: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      priceUuid,
      input,
    }: {
      priceUuid: string
      input: UpdateProductPriceRequest
    }) => updateProductPrice(companyUuid, productUuid, priceUuid, input),
    onSuccess: () => invalidatePrices(queryClient, companyUuid, productUuid),
  })
}

export function useDeactivateProductPrice(
  companyUuid: string,
  productUuid: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      priceUuid,
      input,
    }: {
      priceUuid: string
      input: DeactivateProductPriceRequest
    }) => deactivateProductPrice(companyUuid, productUuid, priceUuid, input),
    onSuccess: () => invalidatePrices(queryClient, companyUuid, productUuid),
  })
}
