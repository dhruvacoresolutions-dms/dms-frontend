"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import {
  FormTextField,
  FormNumberField,
  FormTextareaField,
  FormSwitchField,
  FormComboboxField,
} from "@/components/common/form-fields"
import { FieldGroup } from "@/components/ui/field"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { useProduct } from "../hooks/use-product"
import { useCreateProduct } from "../hooks/use-product-mutations"
import { useUpdateProduct } from "../hooks/use-product-mutations"
import { ProductCategoryCombobox } from "@/features/product-categories/components/ProductCategoryCombobox"
import { ProductUomCombobox } from "@/features/product-uoms/components/ProductUomCombobox"
import { ProductBrandCombobox } from "@/features/product-brands/components/ProductBrandCombobox"
import type {
  CreateProductRequest,
  UpdateProductRequest,
} from "../api/product.types"

const productSchema = z.object({
  code: z.string().min(1, "Code is required").max(60),
  name: z.string().min(1, "Name is required").max(200),
  shortName: z.string().max(60).optional(),
  description: z.string().max(1000).optional(),
  productType: z.string().max(60).optional(),
  categoryUuid: z.string().optional(),
  barcode: z.string().max(60).optional(),
  baseUomUuid: z.string().optional(),
  salesUomUuid: z.string().optional(),
  purchaseUomUuid: z.string().optional(),
  netWeight: z.coerce.number().nonnegative().optional(),
  weightUom: z.string().max(10).optional(),
  batchTrackingEnabled: z.boolean().optional(),
  brandUuid: z.string().optional(),
  manufacturer: z.string().max(200).optional(),
  partNumber: z.string().max(100).optional(),
  oemPartNumber: z.string().max(100).optional(),
  packQuantity: z.coerce.number().int().positive().optional(),
  grossWeight: z.coerce.number().nonnegative().optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

type ProductFormProps = {
  companyUuid: string
  /** When set, edits that product; otherwise creates one */
  productUuid?: string
}

const emptyDefaults: ProductFormValues = {
  code: "",
  name: "",
  shortName: "",
  description: "",
  productType: "",
  categoryUuid: "",
  barcode: "",
  baseUomUuid: "",
  salesUomUuid: "",
  purchaseUomUuid: "",
  netWeight: undefined,
  weightUom: "",
  batchTrackingEnabled: false,
  brandUuid: "",
  manufacturer: "",
  partNumber: "",
  oemPartNumber: "",
  packQuantity: undefined,
  grossWeight: undefined,
}

const orUndefined = (v: unknown) =>
  v === "" || v === undefined || v === null ? undefined : (v as string)

export function ProductForm({ companyUuid, productUuid }: ProductFormProps) {
  const router = useRouter()
  const isEdit = !!productUuid
  const { data: product, isLoading: isDetailLoading } = useProduct(
    companyUuid,
    productUuid ?? ""
  )
  const createMutation = useCreateProduct(companyUuid)
  const updateMutation = useUpdateProduct(companyUuid)

  const { handleSubmit, control, reset } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: emptyDefaults,
  })

  useEffect(() => {
    if (!isEdit || !product) return
    reset({
      code: product.code,
      name: product.name,
      shortName: product.shortName ?? "",
      description: product.description ?? "",
      productType: product.productType ?? "",
      categoryUuid: product.category?.uuid ?? product.categoryUuid ?? "",
      barcode: product.barcode ?? "",
      baseUomUuid: product.baseUom?.uuid ?? product.baseUomUuid ?? "",
      salesUomUuid: product.salesUom?.uuid ?? product.salesUomUuid ?? "",
      purchaseUomUuid:
        product.purchaseUom?.uuid ?? product.purchaseUomUuid ?? "",
      netWeight: product.netWeight,
      weightUom: product.weightUom ?? "",
      batchTrackingEnabled: product.batchTrackingEnabled ?? false,
      brandUuid:
        product.automotiveDetail?.brand?.uuid ??
        product.automotiveDetail?.brandUuid ??
        "",
      manufacturer: product.automotiveDetail?.manufacturer ?? "",
      partNumber: product.automotiveDetail?.partNumber ?? "",
      oemPartNumber: product.automotiveDetail?.oemPartNumber ?? "",
      packQuantity: product.automotiveDetail?.packQuantity,
      grossWeight: product.automotiveDetail?.grossWeight,
    })
  }, [isEdit, product, reset])

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    (isEdit && isDetailLoading)

  const onSubmit = (values: ProductFormValues) => {
    const automotiveDetail =
      values.brandUuid ||
      values.manufacturer ||
      values.partNumber ||
      values.oemPartNumber ||
      values.packQuantity ||
      values.grossWeight
        ? {
            brandUuid: orUndefined(values.brandUuid),
            manufacturer: orUndefined(values.manufacturer),
            partNumber: orUndefined(values.partNumber),
            oemPartNumber: orUndefined(values.oemPartNumber),
            packQuantity: values.packQuantity,
            grossWeight: values.grossWeight,
          }
        : null

    if (isEdit && productUuid && product) {
      const input: UpdateProductRequest = {
        name: values.name,
        shortName: orUndefined(values.shortName),
        description: orUndefined(values.description),
        productType: orUndefined(values.productType),
        categoryUuid: orUndefined(values.categoryUuid),
        barcode: orUndefined(values.barcode),
        baseUomUuid: orUndefined(values.baseUomUuid),
        salesUomUuid: orUndefined(values.salesUomUuid),
        purchaseUomUuid: orUndefined(values.purchaseUomUuid),
        netWeight: values.netWeight,
        weightUom: orUndefined(values.weightUom),
        batchTrackingEnabled: values.batchTrackingEnabled,
        automotiveDetail,
        version: product.version,
      }
      updateMutation.mutate(
        { productUuid, input },
        {
          onSuccess: () => {
            toast.success("Product updated")
            router.push(`/products/${productUuid}`)
          },
          onError: (error) =>
            toast.error(getApiErrorMessage(error, "Update failed")),
        }
      )
      return
    }

    const input: CreateProductRequest = {
      code: values.code,
      name: values.name,
      shortName: orUndefined(values.shortName),
      description: orUndefined(values.description),
      productType: orUndefined(values.productType),
      categoryUuid: orUndefined(values.categoryUuid),
      barcode: orUndefined(values.barcode),
      baseUomUuid: orUndefined(values.baseUomUuid),
      salesUomUuid: orUndefined(values.salesUomUuid),
      purchaseUomUuid: orUndefined(values.purchaseUomUuid),
      netWeight: values.netWeight,
      weightUom: orUndefined(values.weightUom),
      batchTrackingEnabled: values.batchTrackingEnabled,
      automotiveDetail,
    }
    createMutation.mutate(input, {
      onSuccess: (created) => {
        toast.success("Product created")
        router.push(`/products/${created.productUuid}`)
      },
      onError: (error) =>
        toast.error(getApiErrorMessage(error, "Creation failed")),
    })
  }

  if (isEdit && isDetailLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <FormTextField
                control={control}
                name="code"
                label="Code *"
                disabled={isEdit}
              />
              <FormTextField control={control} name="name" label="Name *" />
              <FormTextField
                control={control}
                name="shortName"
                label="Short Name"
              />
              <FormTextField
                control={control}
                name="productType"
                label="Product Type"
              />
              <FormComboboxField
                control={control}
                name="categoryUuid"
                label="Category"
                companyUuid={companyUuid}
                Combobox={ProductCategoryCombobox}
              />
              <FormTextField
                control={control}
                name="barcode"
                label="Barcode"
              />
              <FormTextareaField
                control={control}
                name="description"
                label="Description"
                className="lg:col-span-3"
              />
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Units & Weight</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <FormComboboxField
                control={control}
                name="baseUomUuid"
                label="Base UOM"
                companyUuid={companyUuid}
                Combobox={ProductUomCombobox}
              />
              <FormComboboxField
                control={control}
                name="salesUomUuid"
                label="Sales UOM"
                companyUuid={companyUuid}
                Combobox={ProductUomCombobox}
              />
              <FormComboboxField
                control={control}
                name="purchaseUomUuid"
                label="Purchase UOM"
                companyUuid={companyUuid}
                Combobox={ProductUomCombobox}
              />
              <FormNumberField
                control={control}
                name="netWeight"
                label="Net Weight"
              />
              <FormTextField
                control={control}
                name="weightUom"
                label="Weight UOM"
              />
              <FormSwitchField
                control={control}
                name="batchTrackingEnabled"
                label="Batch Tracking"
                hint="Track inventory by batch"
              />
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Automotive Details</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <FormComboboxField
                control={control}
                name="brandUuid"
                label="Brand"
                companyUuid={companyUuid}
                Combobox={ProductBrandCombobox}
              />
              <FormTextField
                control={control}
                name="manufacturer"
                label="Manufacturer"
              />
              <FormTextField
                control={control}
                name="partNumber"
                label="Part Number"
              />
              <FormTextField
                control={control}
                name="oemPartNumber"
                label="OEM Part Number"
              />
              <FormNumberField
                control={control}
                name="packQuantity"
                label="Pack Quantity"
                step="1"
                min={1}
              />
              <FormNumberField
                control={control}
                name="grossWeight"
                label="Gross Weight"
              />
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            router.push(isEdit && productUuid ? `/products/${productUuid}` : "/products")
          }
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending
            ? isEdit
              ? "Saving..."
              : "Creating..."
            : isEdit
              ? "Save changes"
              : "Create product"}
        </Button>
      </div>
    </form>
  )
}
