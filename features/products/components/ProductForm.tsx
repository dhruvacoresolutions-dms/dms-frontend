"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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
  requiredLabel,
} from "@/components/common/form-fields"
import { FieldGroup } from "@/components/ui/field"
import { Stepper } from "@/components/ui/stepper"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { applyApiFieldErrors } from "@/lib/api/form-errors"
import {
  optionalName,
  optionalText,
  requiredCode,
  requiredName,
} from "@/lib/validations/master-data"
import { useProduct } from "../hooks/use-product"
import { useCreateProduct } from "../hooks/use-product-mutations"
import { useUpdateProduct } from "../hooks/use-product-mutations"
import { useEffectiveProductFieldTemplate } from "@/features/product-field-template/hooks/use-effective-product-field-template"
import { ProductCategoryCombobox } from "@/features/product-categories/components/ProductCategoryCombobox"
import { ProductUomCombobox } from "@/features/product-uoms/components/ProductUomCombobox"
import { ProductBrandCombobox } from "@/features/product-brands/components/ProductBrandCombobox"
import type {
  CreateProductRequest,
  UpdateProductRequest,
} from "../api/product.types"

/**
 * Base field rules mirror the backend `ProductCoreRequest` /
 * `UpdateProductCoreRequest` constraints:
 *  - code     @NotBlank @Size(max=100) @SafeCode
 *  - name     @NotBlank @Size(max=300) @SafeName
 *  - shortName @Size(max=160) @SafeName
 *  - description @Size(max=2000)
 *  - productType @Size(max=40)
 *  - barcode  @Size(max=20)
 *  - netWeight @DecimalMin(0) @Digits(integer=12,fraction=6)
 *  - weightUom @Size(max=20)
 *  - automotive: manufacturer @Size(max=160) @SafeName, partNumber/oemPartNumber
 *    @Size(max=100), packQuantity @Positive int, grossWeight @Digits(12,6)
 */
const baseProductSchema = z.object({
  code: requiredCode("Code", 100),
  name: requiredName("Name", 300),
  shortName: optionalName("Short Name", 160),
  description: optionalText("Description", 2000),
  productType: z
    .string()
    .trim()
    .max(40, "Product Type must not exceed 40 characters")
    .optional(),
  categoryUuid: z.string().optional(),
  barcode: z
    .string()
    .trim()
    .max(20, "Barcode must not exceed 20 characters")
    .optional(),
  baseUomUuid: z.string().optional(),
  salesUomUuid: z.string().optional(),
  purchaseUomUuid: z.string().optional(),
  netWeight: z.coerce
    .number()
    .nonnegative("Net Weight cannot be negative")
    .max(999_999_999_999, "Net Weight is too large")
    .refine(
      (v) => /^\d+(\.\d{1,6})?$/.test(String(v)),
      "Net Weight allows at most 6 decimals"
    )
    .optional(),
  weightUom: z
    .string()
    .trim()
    .max(20, "Weight UOM must not exceed 20 characters")
    .optional(),
  batchTrackingEnabled: z.boolean().optional(),
  brandUuid: z.string().optional(),
  manufacturer: optionalName("Manufacturer", 160),
  partNumber: z
    .string()
    .trim()
    .max(100, "Part Number must not exceed 100 characters")
    .optional(),
  oemPartNumber: z
    .string()
    .trim()
    .max(100, "OEM Part Number must not exceed 100 characters")
    .optional(),
  packQuantity: z.coerce
    .number()
    .int("Pack Quantity must be a whole number")
    .positive("Pack Quantity must be greater than 0")
    .optional(),
  grossWeight: z.coerce
    .number()
    .nonnegative("Gross Weight cannot be negative")
    .max(999_999_999_999, "Gross Weight is too large")
    .refine(
      (v) => /^\d+(\.\d{1,6})?$/.test(String(v)),
      "Gross Weight allows at most 6 decimals"
    )
    .optional(),
})

type ProductFormValues = z.infer<typeof baseProductSchema>

/** Fields the backend always requires regardless of the company template. */
const FIXED_REQUIRED_FIELDS = ["code", "name"] as const

/**
 * Adds the company-configured mandatory product fields
 * (`product_field_template`) on top of the base rules. The backend rejects a
 * create/update when a mandatory field is missing, so the same check runs here.
 */
function buildProductSchema(requiredFields: string[]) {
  const required = new Set(requiredFields)
  return baseProductSchema.superRefine((values, ctx) => {
    const record = values as Record<string, unknown>
    for (const key of required) {
      if (
        FIXED_REQUIRED_FIELDS.includes(
          key as (typeof FIXED_REQUIRED_FIELDS)[number]
        )
      )
        continue
      const value = record[key]
      const present =
        value !== undefined &&
        value !== null &&
        !(typeof value === "string" && value.trim() === "")
      if (!present) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: "This field is required",
        })
      }
    }

    // Backend `ProductCoreService.validate`: net weight and weight UOM must be
    // supplied together (blank weight UOM counts as absent).
    const hasWeight =
      values.netWeight !== undefined && values.netWeight !== null
    const hasWeightUom = !!values.weightUom?.trim()
    if (hasWeight !== hasWeightUom) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: hasWeight ? ["weightUom"] : ["netWeight"],
        message: hasWeight
          ? "Weight UOM is required when Net Weight is supplied"
          : "Net Weight is required when Weight UOM is supplied",
      })
    }
  })
}

const schemaCache = new Map<string, ReturnType<typeof buildProductSchema>>()
function productSchemaFor(requiredFields: string[]) {
  const cacheKey = [...requiredFields].sort().join("|")
  const cached = schemaCache.get(cacheKey)
  if (cached) return cached
  const schema = buildProductSchema(requiredFields)
  schemaCache.set(cacheKey, schema)
  return schema
}

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
  const { data: fieldTemplate } = useEffectiveProductFieldTemplate(companyUuid)

  const [currentStep, setCurrentStep] = useState(0)
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(
    () => new Set([0])
  )

  // Effective template drives both visibility and the red required marker so the
  // form matches what the backend will accept for this company + vertical.
  const fieldRules = useMemo(() => {
    const map = new Map<string, { visible: boolean; mandatory: boolean }>()
    for (const field of fieldTemplate?.fields ?? []) {
      map.set(field.fieldKey, {
        visible: field.visible,
        mandatory: field.mandatory,
      })
    }
    return map
  }, [fieldTemplate])

  const requiredFieldKeys = useMemo(() => {
    // Only enforce mandatory flags for fields this form actually renders —
    // vertical-specific template keys (e.g. FMCG) have no input here, so
    // requiring them would make the form impossible to submit.
    const formKeys = new Set(Object.keys(baseProductSchema.shape))
    const mandatory = [...fieldRules.entries()]
      .filter(([key, rule]) => rule.mandatory && formKeys.has(key))
      .map(([key]) => key)
    return Array.from(new Set<string>([...FIXED_REQUIRED_FIELDS, ...mandatory]))
  }, [fieldRules])

  const isFieldRequired = useCallback(
    (key: keyof ProductFormValues) => requiredFieldKeys.includes(key),
    [requiredFieldKeys]
  )
  const isFieldVisible = useCallback(
    (key: keyof ProductFormValues) => {
      const rule = fieldRules.get(key)
      if (!rule) return true
      // A mandatory field must always be fillable, even if a stale template
      // row left it hidden (the backend still enforces it on create/update).
      return rule.visible || rule.mandatory
    },
    [fieldRules]
  )

  const {
    handleSubmit,
    control,
    reset,
    trigger,
    clearErrors,
    setError,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchemaFor(requiredFieldKeys)),
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

  const fieldLabel = (key: keyof ProductFormValues, text: string) =>
    requiredLabel(text, isFieldRequired(key))

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
          onError: (error) => {
            applyApiFieldErrors(error, setError)
            toast.error(getApiErrorMessage(error, "Update failed"))
          },
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
      onError: (error) => {
        applyApiFieldErrors(error, setError)
        toast.error(getApiErrorMessage(error, "Creation failed"))
      },
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
            <div className="animate-in space-y-6 duration-200 fade-in-50">
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
                  {isFieldVisible("code") && (
                    <FormTextField
                      control={control}
                      name="code"
                      label={fieldLabel("code", "Code")}
                      disabled={isEdit}
                    />
                  )}
                  {isFieldVisible("name") && (
                    <FormTextField
                      control={control}
                      name="name"
                      label={fieldLabel("name", "Name")}
                    />
                  )}
                  {isFieldVisible("shortName") && (
                    <FormTextField
                      control={control}
                      name="shortName"
                      label={fieldLabel("shortName", "Short Name")}
                    />
                  )}
                  {isFieldVisible("productType") && (
                    <FormTextField
                      control={control}
                      name="productType"
                      label={fieldLabel("productType", "Product Type")}
                    />
                  )}
                  {isFieldVisible("categoryUuid") && (
                    <FormComboboxField
                      control={control}
                      name="categoryUuid"
                      label={fieldLabel("categoryUuid", "Category")}
                      companyUuid={companyUuid}
                      Combobox={ProductCategoryCombobox}
                    />
                  )}
                  {isFieldVisible("barcode") && (
                    <FormTextField
                      control={control}
                      name="barcode"
                      label={fieldLabel("barcode", "Barcode")}
                    />
                  )}
                  {isFieldVisible("description") && (
                    <FormTextareaField
                      control={control}
                      name="description"
                      label={fieldLabel("description", "Description")}
                      className="lg:col-span-3"
                    />
                  )}
                </div>
              </FieldGroup>
            </div>
          )}

          {currentStep === 1 && (
            <div className="animate-in space-y-6 duration-200 fade-in-50">
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
                  {isFieldVisible("baseUomUuid") && (
                    <FormComboboxField
                      control={control}
                      name="baseUomUuid"
                      label={fieldLabel("baseUomUuid", "Base UOM")}
                      companyUuid={companyUuid}
                      Combobox={ProductUomCombobox}
                    />
                  )}
                  {isFieldVisible("salesUomUuid") && (
                    <FormComboboxField
                      control={control}
                      name="salesUomUuid"
                      label={fieldLabel("salesUomUuid", "Sales UOM")}
                      companyUuid={companyUuid}
                      Combobox={ProductUomCombobox}
                    />
                  )}
                  {isFieldVisible("purchaseUomUuid") && (
                    <FormComboboxField
                      control={control}
                      name="purchaseUomUuid"
                      label={fieldLabel("purchaseUomUuid", "Purchase UOM")}
                      companyUuid={companyUuid}
                      Combobox={ProductUomCombobox}
                    />
                  )}
                  {isFieldVisible("netWeight") && (
                    <FormNumberField
                      control={control}
                      name="netWeight"
                      label={fieldLabel("netWeight", "Net Weight")}
                    />
                  )}
                  {isFieldVisible("weightUom") && (
                    <FormTextField
                      control={control}
                      name="weightUom"
                      label={fieldLabel("weightUom", "Weight UOM")}
                    />
                  )}
                  {isFieldVisible("batchTrackingEnabled") && (
                    <FormSwitchField
                      control={control}
                      name="batchTrackingEnabled"
                      label="Batch Tracking"
                      hint="Track inventory by batch"
                    />
                  )}
                </div>
              </FieldGroup>
            </div>
          )}

          {currentStep === 2 && (
            <div className="animate-in space-y-6 duration-200 fade-in-50">
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
                  {isFieldVisible("brandUuid") && (
                    <FormComboboxField
                      control={control}
                      name="brandUuid"
                      label={fieldLabel("brandUuid", "Brand")}
                      companyUuid={companyUuid}
                      Combobox={ProductBrandCombobox}
                    />
                  )}
                  {isFieldVisible("manufacturer") && (
                    <FormTextField
                      control={control}
                      name="manufacturer"
                      label={fieldLabel("manufacturer", "Manufacturer")}
                    />
                  )}
                  {isFieldVisible("partNumber") && (
                    <FormTextField
                      control={control}
                      name="partNumber"
                      label={fieldLabel("partNumber", "Part Number")}
                    />
                  )}
                  {isFieldVisible("oemPartNumber") && (
                    <FormTextField
                      control={control}
                      name="oemPartNumber"
                      label={fieldLabel("oemPartNumber", "OEM Part Number")}
                    />
                  )}
                  {isFieldVisible("packQuantity") && (
                    <FormNumberField
                      control={control}
                      name="packQuantity"
                      label={fieldLabel("packQuantity", "Pack Quantity")}
                      step="1"
                      min={1}
                    />
                  )}
                  {isFieldVisible("grossWeight") && (
                    <FormNumberField
                      control={control}
                      name="grossWeight"
                      label={fieldLabel("grossWeight", "Gross Weight")}
                    />
                  )}
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
