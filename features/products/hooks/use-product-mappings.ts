"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  getProductGstMappings,
  createProductGstMapping,
  updateProductGstMapping,
  updateProductGstMappingStatus,
  getProductRelationships,
  createProductRelationship,
  updateProductRelationship,
  updateProductRelationshipStatus,
  getProductFitments,
  createProductFitment,
  updateProductFitment,
  updateProductFitmentStatus,
  getProductGeographyMappings,
  createProductGeographyMapping,
  updateProductGeographyMapping,
  updateProductGeographyMappingStatus,
} from "../api/product-subresources.api"
import { productKeys } from "../api/product-keys"
import type {
  CreateProductGstMappingRequest,
  UpdateProductGstMappingRequest,
  UpdateProductGstMappingStatusRequest,
  CreateProductRelationshipRequest,
  UpdateProductRelationshipRequest,
  UpdateProductRelationshipStatusRequest,
  CreateProductFitmentRequest,
  UpdateProductFitmentRequest,
  UpdateProductFitmentStatusRequest,
  CreateProductGeographyMappingRequest,
  UpdateProductGeographyMappingRequest,
  UpdateProductGeographyMappingStatusRequest,
} from "../api/product.types"

type QC = ReturnType<typeof useQueryClient>

// ── GST mappings ─────────────────────────────────────────────────────────────

export function useProductGstMappings(
  companyUuid: string,
  productUuid: string
) {
  return useQuery({
    queryKey: productKeys.gstMappings(companyUuid, productUuid),
    queryFn: () => getProductGstMappings(companyUuid, productUuid),
    enabled: !!companyUuid && !!productUuid,
  })
}

export function useCreateProductGstMapping(
  companyUuid: string,
  productUuid: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProductGstMappingRequest) =>
      createProductGstMapping(companyUuid, productUuid, input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: productKeys.gstMappings(companyUuid, productUuid),
      }),
  })
}

export function useUpdateProductGstMappingStatus(
  companyUuid: string,
  productUuid: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      gstMappingUuid,
      input,
    }: {
      gstMappingUuid: string
      input: UpdateProductGstMappingStatusRequest
    }) =>
      updateProductGstMappingStatus(
        companyUuid,
        productUuid,
        gstMappingUuid,
        input
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: productKeys.gstMappings(companyUuid, productUuid),
      }),
  })
}

export function useUpdateProductGstMapping(
  companyUuid: string,
  productUuid: string
) {
  const queryClient: QC = useQueryClient()
  return useMutation({
    mutationFn: ({
      gstMappingUuid,
      input,
    }: {
      gstMappingUuid: string
      input: UpdateProductGstMappingRequest
    }) =>
      updateProductGstMapping(companyUuid, productUuid, gstMappingUuid, input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: productKeys.gstMappings(companyUuid, productUuid),
      }),
  })
}

// ── Relationships ────────────────────────────────────────────────────────────

export function useProductRelationships(
  companyUuid: string,
  productUuid: string
) {
  return useQuery({
    queryKey: productKeys.relationships(companyUuid, productUuid),
    queryFn: () => getProductRelationships(companyUuid, productUuid),
    enabled: !!companyUuid && !!productUuid,
  })
}

export function useCreateProductRelationship(
  companyUuid: string,
  productUuid: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProductRelationshipRequest) =>
      createProductRelationship(companyUuid, productUuid, input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: productKeys.relationships(companyUuid, productUuid),
      }),
  })
}

export function useUpdateProductRelationship(
  companyUuid: string,
  productUuid: string
) {
  const queryClient: QC = useQueryClient()
  return useMutation({
    mutationFn: ({
      relationshipUuid,
      input,
    }: {
      relationshipUuid: string
      input: UpdateProductRelationshipRequest
    }) =>
      updateProductRelationship(
        companyUuid,
        productUuid,
        relationshipUuid,
        input
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: productKeys.relationships(companyUuid, productUuid),
      }),
  })
}

export function useUpdateProductRelationshipStatus(
  companyUuid: string,
  productUuid: string
) {
  const queryClient: QC = useQueryClient()
  return useMutation({
    mutationFn: ({
      relationshipUuid,
      input,
    }: {
      relationshipUuid: string
      input: UpdateProductRelationshipStatusRequest
    }) =>
      updateProductRelationshipStatus(
        companyUuid,
        productUuid,
        relationshipUuid,
        input
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: productKeys.relationships(companyUuid, productUuid),
      }),
  })
}

// ── Fitments ─────────────────────────────────────────────────────────────────

export function useProductFitments(companyUuid: string, productUuid: string) {
  return useQuery({
    queryKey: productKeys.fitments(companyUuid, productUuid),
    queryFn: () => getProductFitments(companyUuid, productUuid),
    enabled: !!companyUuid && !!productUuid,
  })
}

export function useCreateProductFitment(
  companyUuid: string,
  productUuid: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProductFitmentRequest) =>
      createProductFitment(companyUuid, productUuid, input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: productKeys.fitments(companyUuid, productUuid),
      }),
  })
}

export function useUpdateProductFitment(
  companyUuid: string,
  productUuid: string
) {
  const queryClient: QC = useQueryClient()
  return useMutation({
    mutationFn: ({
      fitmentUuid,
      input,
    }: {
      fitmentUuid: string
      input: UpdateProductFitmentRequest
    }) => updateProductFitment(companyUuid, productUuid, fitmentUuid, input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: productKeys.fitments(companyUuid, productUuid),
      }),
  })
}

export function useUpdateProductFitmentStatus(
  companyUuid: string,
  productUuid: string
) {
  const queryClient: QC = useQueryClient()
  return useMutation({
    mutationFn: ({
      fitmentUuid,
      input,
    }: {
      fitmentUuid: string
      input: UpdateProductFitmentStatusRequest
    }) =>
      updateProductFitmentStatus(companyUuid, productUuid, fitmentUuid, input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: productKeys.fitments(companyUuid, productUuid),
      }),
  })
}

// ── Geography mappings ───────────────────────────────────────────────────────

export function useProductGeographyMappings(
  companyUuid: string,
  productUuid: string
) {
  return useQuery({
    queryKey: productKeys.geographyMappings(companyUuid, productUuid),
    queryFn: () => getProductGeographyMappings(companyUuid, productUuid),
    enabled: !!companyUuid && !!productUuid,
  })
}

export function useCreateProductGeographyMapping(
  companyUuid: string,
  productUuid: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProductGeographyMappingRequest) =>
      createProductGeographyMapping(companyUuid, productUuid, input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: productKeys.geographyMappings(companyUuid, productUuid),
      }),
  })
}

export function useUpdateProductGeographyMapping(
  companyUuid: string,
  productUuid: string
) {
  const queryClient: QC = useQueryClient()
  return useMutation({
    mutationFn: ({
      geographyMappingUuid,
      input,
    }: {
      geographyMappingUuid: string
      input: UpdateProductGeographyMappingRequest
    }) =>
      updateProductGeographyMapping(
        companyUuid,
        productUuid,
        geographyMappingUuid,
        input
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: productKeys.geographyMappings(companyUuid, productUuid),
      }),
  })
}

export function useUpdateProductGeographyMappingStatus(
  companyUuid: string,
  productUuid: string
) {
  const queryClient: QC = useQueryClient()
  return useMutation({
    mutationFn: ({
      geographyMappingUuid,
      input,
    }: {
      geographyMappingUuid: string
      input: UpdateProductGeographyMappingStatusRequest
    }) =>
      updateProductGeographyMappingStatus(
        companyUuid,
        productUuid,
        geographyMappingUuid,
        input
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: productKeys.geographyMappings(companyUuid, productUuid),
      }),
  })
}
