"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, type FieldErrors } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowLeft, ArrowRight, CarFront, Package, Scale } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  FormTextField,
  FormNumberField,
  FormTextareaField,
  FormSwitchField,
  FormComboboxField,
} from "@/components/common/form-fields"
import { FieldGroup } from "@/components/ui/field"
import { Stepper } from "@/components/ui/stepper"
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

const STEPS = [
  {
    id: "basic-info",
    title: "Basic Information",
    description: "Identity & classification",
    icon: Package,
  },
  {
    id: "units-weight",
    title: "Units & Weight",
    description: "UOMs & batch tracking",
    icon: Scale,
  },
  {
    id: "automotive",
    title: "Automotive Details",
    description: "Brand & part info",
    icon: CarFront,
    optional: true,
  },
] as const

const STEP_FIELDS: Record<number, (keyof ProductFormValues)[]> = {
  0: [
    "code",
    "name",
    "shortName",
    "productType",
    "categoryUuid",
    "barcode",
    "description",
  ],
  1: [
    "baseUomUuid",
    "salesUomUuid",
    "purchaseUomUuid",
    "netWeight",
    "weightUom",
    "batchTrackingEnabled",
  ],
  2: [
    "brandUuid",
    "manufacturer",
    "partNumber",
    "oemPartNumber",
    "packQuantity",
    "grossWeight",
  ],
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

  const [currentStep, setCurrentStep] = useState(0)
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(
    () => new Set([0])
  )

  const {
    handleSubmit,
    control,
    reset,
    trigger,
    clearErrors,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    // Validate only when Next / stepper / Submit is clicked — never per field.
    mode: "onSubmit",
    reValidateMode: "onSubmit",
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

  const cancelHref =
    isEdit && productUuid ? `/products/${productUuid}` : "/products"

  const handleNext = async () => {
    const fields = STEP_FIELDS[currentStep]
    const valid = await trigger(fields, { shouldFocus: true })
    if (valid) {
      const next = Math.min(currentStep + 1, STEPS.length - 1)
      setVisitedSteps((prev) => new Set([...prev, next]))
      setCurrentStep(next)
      requestAnimationFrame(() => clearErrors(STEP_FIELDS[next]))
    } else {
      setVisitedSteps((prev) => new Set([...prev, currentStep]))
      toast.error("Please fix the errors before continuing")
    }
  }

  const handleBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 0))
  }

  const handleStepClick = async (index: number) => {
    if (index === currentStep) return
    if (index < currentStep) {
      setCurrentStep(index)
      return
    }
    for (let i = currentStep; i < index; i++) {
      const valid = await trigger(STEP_FIELDS[i], { shouldFocus: true })
      if (!valid) {
        setVisitedSteps((prev) => new Set([...prev, i]))
        toast.error(`Please complete step ${i + 1} before continuing`)
        return
      }
      setVisitedSteps((prev) => new Set([...prev, i + 1]))
    }
    setVisitedSteps((prev) => new Set([...prev, index]))
    setCurrentStep(index)
    requestAnimationFrame(() => clearErrors(STEP_FIELDS[index]))
  }

  const onInvalidSubmit = (fieldErrors: FieldErrors<ProductFormValues>) => {
    // Submit validates every step — jump to the first step holding an error
    // so the user actually sees what failed.
    for (let i = 0; i < STEPS.length; i++) {
      if (STEP_FIELDS[i].some((field) => !!fieldErrors[field])) {
        setVisitedSteps((prev) => new Set([...prev, i]))
        setCurrentStep(i)
        toast.error(
          i === currentStep
            ? "Please fix the errors before submitting"
            : `Please fix the errors in step ${i + 1} before submitting`
        )
        return
      }
    }
    toast.error("Please fix the errors before submitting")
  }

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

  const stepperSteps = STEPS.map((s) => ({
    ...s,
    icon: <s.icon className="size-4" />,
  }))

  const errorSteps = STEPS.map((_, idx) =>
    visitedSteps.has(idx)
      ? STEP_FIELDS[idx].some((field) => !!errors[field])
      : false
  )
    .map((hasError, idx) => (hasError ? idx : -1))
    .filter((v) => v !== -1)

  if (isEdit && isDetailLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="py-2">
        <Stepper
          steps={stepperSteps}
          currentStep={currentStep}
          onStepChange={handleStepClick}
          errorSteps={errorSteps}
        />
      </div>

      <form
        onSubmit={handleSubmit(onSubmit, onInvalidSubmit)}
        className="flex w-full flex-1 flex-col"
        noValidate
      >
        <div className="flex-1 space-y-6 pb-4">
          {currentStep === 0 && (
            <div className="animate-in fade-in-50 space-y-6 duration-200">
              <div className="space-y-1.5 border-b pb-5">
                <h2 className="text-[15px] font-semibold tracking-tight">
                  Basic Information
                </h2>
                <p className="text-sm text-muted-foreground">
                  Core identity and classification
                </p>
              </div>
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
            </div>
          )}

          {currentStep === 1 && (
            <div className="animate-in fade-in-50 space-y-6 duration-200">
              <div className="space-y-1.5 border-b pb-5">
                <h2 className="text-[15px] font-semibold tracking-tight">
                  Units & Weight
                </h2>
                <p className="text-sm text-muted-foreground">
                  Units of measure, weight and batch tracking
                </p>
              </div>
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
            </div>
          )}

          {currentStep === 2 && (
            <div className="animate-in fade-in-50 space-y-6 duration-200">
              <div className="space-y-1.5 border-b pb-5">
                <h2 className="text-[15px] font-semibold tracking-tight">
                  Automotive Details{" "}
                  <span className="font-normal text-muted-foreground">
                    (Optional)
                  </span>
                </h2>
                <p className="text-sm text-muted-foreground">
                  Brand, manufacturer and part numbers — skip if not applicable
                </p>
              </div>
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
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between border-t bg-background pt-4 pb-2">
          <div className="flex items-center gap-2">
            {currentStep > 0 ? (
              <Button type="button" variant="outline" onClick={handleBack}>
                <ArrowLeft className="size-4" />
                Back
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(cancelHref)}
              >
                Cancel
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:block">
              Step {currentStep + 1} of {STEPS.length}
            </span>
            {currentStep === 0 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push(cancelHref)}
              >
                Cancel
              </Button>
            )}
            {currentStep < STEPS.length - 1 ? (
              <Button type="button" onClick={handleNext}>
                Next
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <>
                {currentStep > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.push(cancelHref)}
                  >
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={isPending}>
                  {isPending
                    ? isEdit
                      ? "Saving..."
                      : "Creating..."
                    : isEdit
                      ? "Save changes"
                      : "Create product"}
                </Button>
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
