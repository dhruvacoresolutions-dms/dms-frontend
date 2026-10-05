"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { useProduct } from "../hooks/use-product"
import { useCreateProduct } from "../hooks/use-product-mutations"
import { useUpdateProduct } from "../hooks/use-product-mutations"
import { useProductCategories } from "@/features/product-categories/hooks/use-product-categories"
import { useProductUoms } from "@/features/product-uoms/hooks/use-product-uoms"
import { useProductBrands } from "@/features/product-brands/hooks/use-product-brands"
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

  const { data: categoriesData } = useProductCategories(companyUuid, {
    size: 200,
  })
  const { data: uomsData } = useProductUoms(companyUuid, { size: 200 })
  const { data: brandsData } = useProductBrands(companyUuid, { size: 200 })

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
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

  const batchTracking = useWatch({ control, name: "batchTrackingEnabled" })
  const categoryUuidValue = useWatch({ control, name: "categoryUuid" })
  const brandUuidValue = useWatch({ control, name: "brandUuid" })
  const baseUomValue = useWatch({ control, name: "baseUomUuid" })
  const salesUomValue = useWatch({ control, name: "salesUomUuid" })
  const purchaseUomValue = useWatch({ control, name: "purchaseUomUuid" })

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
              <Field>
                <FieldLabel>Code *</FieldLabel>
                <Input
                  placeholder="e.g. BRK-PAD-001"
                  {...register("code")}
                  disabled={isEdit}
                  autoComplete="off"
                />
                <FieldError errors={[errors.code]} />
              </Field>
              <Field>
                <FieldLabel>Name *</FieldLabel>
                <Input
                  placeholder="e.g. Front Brake Pad"
                  {...register("name")}
                  autoComplete="off"
                />
                <FieldError errors={[errors.name]} />
              </Field>
              <Field>
                <FieldLabel>Short Name</FieldLabel>
                <Input {...register("shortName")} autoComplete="off" />
                <FieldError errors={[errors.shortName]} />
              </Field>
              <Field>
                <FieldLabel>Product Type</FieldLabel>
                <Input
                  placeholder="e.g. SPARE_PART"
                  {...register("productType")}
                  autoComplete="off"
                />
                <FieldError errors={[errors.productType]} />
              </Field>
              <Field>
                <FieldLabel>Category</FieldLabel>
                <Select
                  value={categoryUuidValue || ""}
                  onValueChange={(v: string | null) => {
                    if (v) setValue("categoryUuid", v, { shouldValidate: true })
                    }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(categoriesData?.content ?? []).map((c) => (
                      <SelectItem key={c.categoryUuid} value={c.categoryUuid}>
                        {c.name} ({c.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[errors.categoryUuid]} />
              </Field>
              <Field>
                <FieldLabel>Barcode</FieldLabel>
                <Input {...register("barcode")} autoComplete="off" />
                <FieldError errors={[errors.barcode]} />
              </Field>
              <Field className="lg:col-span-3">
                <FieldLabel>Description</FieldLabel>
                <Textarea
                  placeholder="Optional product description"
                  {...register("description")}
                />
                <FieldError errors={[errors.description]} />
              </Field>
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
              {(
                [
                  ["baseUomUuid", "Base UOM", baseUomValue],
                  ["salesUomUuid", "Sales UOM", salesUomValue],
                  ["purchaseUomUuid", "Purchase UOM", purchaseUomValue],
                ] as const
              ).map(([name, label, fieldValue]) => (
                <Field key={name}>
                  <FieldLabel>{label}</FieldLabel>
                  <Select
                    value={fieldValue || ""}
                    onValueChange={(v: string | null) => {
                      if (v) setValue(name, v, { shouldValidate: true })
                      }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {(uomsData?.content ?? []).map((u) => (
                        <SelectItem key={u.uomUuid} value={u.uomUuid}>
                          {u.name} ({u.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={[errors[name]]} />
                </Field>
              ))}
              <Field>
                <FieldLabel>Net Weight</FieldLabel>
                <Input
                  type="number"
                  step="any"
                  {...register("netWeight")}
                />
                <FieldError errors={[errors.netWeight]} />
              </Field>
              <Field>
                <FieldLabel>Weight UOM</FieldLabel>
                <Input placeholder="e.g. KG" {...register("weightUom")} />
                <FieldError errors={[errors.weightUom]} />
              </Field>
              <Field>
                <FieldLabel>Batch Tracking</FieldLabel>
                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    checked={!!batchTracking}
                    onCheckedChange={(v) =>
                      setValue("batchTrackingEnabled", v)
                    }
                  />
                  <span className="text-sm text-muted-foreground">
                    Track inventory by batch
                  </span>
                </div>
              </Field>
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
              <Field>
                <FieldLabel>Brand</FieldLabel>
                <Select
                  value={brandUuidValue || ""}
                  onValueChange={(v: string | null) => {
                    if (v) setValue("brandUuid", v, { shouldValidate: true })
                    }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {(brandsData?.content ?? []).map((b) => (
                      <SelectItem key={b.brandUuid} value={b.brandUuid}>
                        {b.name} ({b.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[errors.brandUuid]} />
              </Field>
              <Field>
                <FieldLabel>Manufacturer</FieldLabel>
                <Input {...register("manufacturer")} autoComplete="off" />
                <FieldError errors={[errors.manufacturer]} />
              </Field>
              <Field>
                <FieldLabel>Part Number</FieldLabel>
                <Input {...register("partNumber")} autoComplete="off" />
                <FieldError errors={[errors.partNumber]} />
              </Field>
              <Field>
                <FieldLabel>OEM Part Number</FieldLabel>
                <Input {...register("oemPartNumber")} autoComplete="off" />
                <FieldError errors={[errors.oemPartNumber]} />
              </Field>
              <Field>
                <FieldLabel>Pack Quantity</FieldLabel>
                <Input
                  type="number"
                  step="1"
                  {...register("packQuantity")}
                />
                <FieldError errors={[errors.packQuantity]} />
              </Field>
              <Field>
                <FieldLabel>Gross Weight</FieldLabel>
                <Input
                  type="number"
                  step="any"
                  {...register("grossWeight")}
                />
                <FieldError errors={[errors.grossWeight]} />
              </Field>
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
