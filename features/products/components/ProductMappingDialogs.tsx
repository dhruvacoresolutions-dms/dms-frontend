"use client"

import { useEffect, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { getApiErrorMessage } from "@/lib/api/api-error"
import {
  useCreateProductGstMapping,
  useCreateProductRelationship,
  useCreateProductFitment,
  useCreateProductGeographyMapping,
} from "../hooks/use-product-mappings"
import { useGstHsns } from "@/features/gst-hsn/hooks/use-gst-hsns"
import { useGstTaxStructures } from "@/features/gst-tax-structures/hooks/use-gst-tax-structures"
import { useRelationshipTypes } from "@/features/relationship-types/hooks/use-relationship-types"
import { getRelationshipTypeId } from "@/features/relationship-types/api/relationship-type.types"
import { useVehicleVariants } from "@/features/vehicle-variants/hooks/use-vehicle-variants"
import { useFuelTypes } from "@/features/fuel-types/hooks/use-fuel-types"
import { getFuelTypeId } from "@/features/fuel-types/api/fuel-type.types"
import { useFitmentPositions } from "@/features/fitment-positions/hooks/use-fitment-positions"
import { getFitmentPositionId } from "@/features/fitment-positions/api/fitment-position.types"
import { useGeographies } from "@/features/geographies/hooks/use-geographies"
import { useProducts } from "../hooks/use-products"

type BaseProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  productUuid: string
}

// ── GST mapping ──────────────────────────────────────────────────────────────

const gstSchema = z.object({
  hsnUuid: z.string().min(1, "HSN is required"),
  taxStructureUuid: z.string().min(1, "Tax structure is required"),
  effectiveFrom: z.string().optional(),
  effectiveTo: z.string().optional(),
})

export function ProductGstMappingDialog({
  open,
  onOpenChange,
  companyUuid,
  productUuid,
}: BaseProps) {
  const { data: hsnData } = useGstHsns(companyUuid, { size: 200 })
  const { data: taxData } = useGstTaxStructures(companyUuid, { size: 200 })
  const createMutation = useCreateProductGstMapping(companyUuid, productUuid)
  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof gstSchema>>({
    resolver: zodResolver(gstSchema),
    defaultValues: { hsnUuid: "", taxStructureUuid: "", effectiveFrom: "", effectiveTo: "" },
  })

  useEffect(() => {
    if (open)
      reset({ hsnUuid: "", taxStructureUuid: "", effectiveFrom: "", effectiveTo: "" })
  }, [open, reset])

  const hsnUuid = useWatch({ control, name: "hsnUuid" })
  const taxStructureUuid = useWatch({ control, name: "taxStructureUuid" })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add GST Mapping</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((values) =>
            createMutation.mutate(
              {
                hsnUuid: values.hsnUuid,
                taxStructureUuid: values.taxStructureUuid,
                effectiveFrom: values.effectiveFrom || undefined,
                effectiveTo: values.effectiveTo || undefined,
              },
              {
                onSuccess: () => {
                  toast.success("GST mapping added")
                  onOpenChange(false)
                },
                onError: (error) =>
                  toast.error(getApiErrorMessage(error, "Creation failed")),
              }
            )
          )}
          className="space-y-4"
        >
          <FieldGroup>
            <Field>
              <FieldLabel>HSN *</FieldLabel>
              <Select
                value={hsnUuid || ""}
                onValueChange={(v: string | null) => { if (v) setValue("hsnUuid", v, { shouldValidate: true }) }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select HSN" />
                </SelectTrigger>
                <SelectContent>
                  {(hsnData?.content ?? []).map((h) => (
                    <SelectItem key={h.hsnUuid} value={h.hsnUuid}>
                      {h.hsnCode} — {h.description ?? ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[errors.hsnUuid]} />
            </Field>
            <Field>
              <FieldLabel>Tax Structure *</FieldLabel>
              <Select
                value={taxStructureUuid || ""}
                onValueChange={(v: string | null) => {
                  if (v) setValue("taxStructureUuid", v, { shouldValidate: true })
                  }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tax structure" />
                </SelectTrigger>
                <SelectContent>
                  {(taxData?.content ?? []).map((t) => (
                    <SelectItem key={t.taxStructureUuid} value={t.taxStructureUuid}>
                      {t.taxType} — {t.taxCode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[errors.taxStructureUuid]} />
            </Field>
            <Field>
              <FieldLabel>Effective From</FieldLabel>
              <Input type="date" {...register("effectiveFrom")} />
            </Field>
            <Field>
              <FieldLabel>Effective To</FieldLabel>
              <Input type="date" {...register("effectiveTo")} />
            </Field>
          </FieldGroup>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Adding..." : "Add mapping"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Relationship ─────────────────────────────────────────────────────────────

const relSchema = z.object({
  relatedProductUuid: z.string().min(1, "Related product is required"),
  relationshipTypeUuid: z.string().min(1, "Relationship type is required"),
  description: z.string().max(500).optional(),
})

export function ProductRelationshipDialog({
  open,
  onOpenChange,
  companyUuid,
  productUuid,
}: BaseProps) {
  const [productSearch, setProductSearch] = useState("")
  const { data: productsData } = useProducts(companyUuid, {
    search: productSearch || undefined,
    size: 50,
  })
  const { data: relTypesData } = useRelationshipTypes(companyUuid, { size: 200 })
  const createMutation = useCreateProductRelationship(companyUuid, productUuid)
  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof relSchema>>({
    resolver: zodResolver(relSchema),
    defaultValues: { relatedProductUuid: "", relationshipTypeUuid: "", description: "" },
  })

  useEffect(() => {
    if (open) {
      reset({ relatedProductUuid: "", relationshipTypeUuid: "", description: "" })
    }
  }, [open, reset])

  const relatedProductUuid = useWatch({ control, name: "relatedProductUuid" })
  const relationshipTypeUuid = useWatch({ control, name: "relationshipTypeUuid" })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setProductSearch("")
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Relationship</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((values) =>
            createMutation.mutate(
              {
                relatedProductUuid: values.relatedProductUuid,
                relationshipTypeUuid: values.relationshipTypeUuid,
                description: values.description || undefined,
              },
              {
                onSuccess: () => {
                  toast.success("Relationship added")
                  onOpenChange(false)
                },
                onError: (error) =>
                  toast.error(getApiErrorMessage(error, "Creation failed")),
              }
            )
          )}
          className="space-y-4"
        >
          <FieldGroup>
            <Field>
              <FieldLabel>Related Product *</FieldLabel>
              <Input
                placeholder="Type to search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
              <Select
                value={relatedProductUuid || ""}
                onValueChange={(v: string | null) => {
                  if (v) setValue("relatedProductUuid", v, { shouldValidate: true })
                  }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {(productsData?.content ?? [])
                    .filter((p) => p.productUuid !== productUuid)
                    .map((p) => (
                      <SelectItem key={p.productUuid} value={p.productUuid}>
                        {p.name} ({p.code})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FieldError errors={[errors.relatedProductUuid]} />
            </Field>
            <Field>
              <FieldLabel>Relationship Type *</FieldLabel>
              <Select
                value={relationshipTypeUuid || ""}
                onValueChange={(v: string | null) => {
                  if (v) setValue("relationshipTypeUuid", v, { shouldValidate: true })
                  }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {(relTypesData?.content ?? []).map((t) => (
                    <SelectItem
                      key={getRelationshipTypeId(t)}
                      value={getRelationshipTypeId(t)}
                    >
                      {t.name} ({t.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[errors.relationshipTypeUuid]} />
            </Field>
            <Field>
              <FieldLabel>Description</FieldLabel>
              <Textarea {...register("description")} />
              <FieldError errors={[errors.description]} />
            </Field>
          </FieldGroup>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Adding..." : "Add relationship"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Fitment ──────────────────────────────────────────────────────────────────

const fitmentSchema = z.object({
  variantUuid: z.string().min(1, "Variant is required"),
  fuelTypeUuid: z.string().optional(),
  engine: z.string().max(120).optional(),
  yearFrom: z.string().optional(),
  yearTo: z.string().optional(),
  fitmentPositionUuid: z.string().optional(),
})

export function ProductFitmentDialog({
  open,
  onOpenChange,
  companyUuid,
  productUuid,
}: BaseProps) {
  const { data: variantsData } = useVehicleVariants(companyUuid, { size: 200 })
  const { data: fuelsData } = useFuelTypes(companyUuid, { size: 200 })
  const { data: positionsData } = useFitmentPositions(companyUuid, { size: 200 })
  const createMutation = useCreateProductFitment(companyUuid, productUuid)
  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof fitmentSchema>>({
    resolver: zodResolver(fitmentSchema),
    defaultValues: {
      variantUuid: "",
      fuelTypeUuid: "",
      engine: "",
      yearFrom: "",
      yearTo: "",
      fitmentPositionUuid: "",
    },
  })

  useEffect(() => {
    if (open)
      reset({
        variantUuid: "",
        fuelTypeUuid: "",
        engine: "",
        yearFrom: "",
        yearTo: "",
        fitmentPositionUuid: "",
      })
  }, [open, reset])

  const variantUuid = useWatch({ control, name: "variantUuid" })
  const fuelTypeUuid = useWatch({ control, name: "fuelTypeUuid" })
  const fitmentPositionUuid = useWatch({ control, name: "fitmentPositionUuid" })
  const orUndefined = (v?: string) => (v === "" ? undefined : v)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Fitment</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((values) =>
            createMutation.mutate(
              {
                variantUuid: values.variantUuid,
                fuelTypeUuid: orUndefined(values.fuelTypeUuid),
                engine: orUndefined(values.engine),
                yearFrom: orUndefined(values.yearFrom),
                yearTo: orUndefined(values.yearTo),
                fitmentPositionUuid: orUndefined(values.fitmentPositionUuid),
              },
              {
                onSuccess: () => {
                  toast.success("Fitment added")
                  onOpenChange(false)
                },
                onError: (error) =>
                  toast.error(getApiErrorMessage(error, "Creation failed")),
              }
            )
          )}
          className="space-y-4"
        >
          <FieldGroup>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Field>
                <FieldLabel>Variant *</FieldLabel>
                <Select
                  value={variantUuid || ""}
                  onValueChange={(v: string | null) => { if (v) setValue("variantUuid", v, { shouldValidate: true }) }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select variant" />
                  </SelectTrigger>
                  <SelectContent>
                    {(variantsData?.content ?? []).map((v) => (
                      <SelectItem key={v.variantUuid} value={v.variantUuid}>
                        {v.name} ({v.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[errors.variantUuid]} />
              </Field>
              <Field>
                <FieldLabel>Fuel Type</FieldLabel>
                <Select
                  value={fuelTypeUuid || ""}
                  onValueChange={(v: string | null) => { if (v) setValue("fuelTypeUuid", v) }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fuel" />
                  </SelectTrigger>
                  <SelectContent>
                    {(fuelsData?.content ?? []).map((f) => (
                      <SelectItem
                        key={getFuelTypeId(f)}
                        value={getFuelTypeId(f)}
                      >
                        {f.name} ({f.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Engine</FieldLabel>
                <Input placeholder="e.g. 1.5L Petrol" {...register("engine")} />
              </Field>
              <Field>
                <FieldLabel>Fitment Position</FieldLabel>
                <Select
                  value={fitmentPositionUuid || ""}
                  onValueChange={(v: string | null) => { if (v) setValue("fitmentPositionUuid", v) }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {(positionsData?.content ?? []).map((p) => (
                      <SelectItem
                        key={getFitmentPositionId(p)}
                        value={getFitmentPositionId(p)}
                      >
                        {p.name} ({p.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Year From</FieldLabel>
                <Input type="date" {...register("yearFrom")} />
              </Field>
              <Field>
                <FieldLabel>Year To</FieldLabel>
                <Input type="date" {...register("yearTo")} />
              </Field>
            </div>
          </FieldGroup>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Adding..." : "Add fitment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Geography mapping ────────────────────────────────────────────────────────

const geoSchema = z.object({
  geographyUuid: z.string().min(1, "Geography is required"),
})

export function ProductGeographyMappingDialog({
  open,
  onOpenChange,
  companyUuid,
  productUuid,
}: BaseProps) {
  const { data: geoData } = useGeographies(companyUuid, { size: 200 })
  const createMutation = useCreateProductGeographyMapping(
    companyUuid,
    productUuid
  )
  const {
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof geoSchema>>({
    resolver: zodResolver(geoSchema),
    defaultValues: { geographyUuid: "" },
  })

  useEffect(() => {
    if (open) reset({ geographyUuid: "" })
  }, [open, reset])

  const geographyUuid = useWatch({ control, name: "geographyUuid" })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Geography Mapping</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((values) =>
            createMutation.mutate(
              { geographyUuid: values.geographyUuid },
              {
                onSuccess: () => {
                  toast.success("Mapping added")
                  onOpenChange(false)
                },
                onError: (error) =>
                  toast.error(getApiErrorMessage(error, "Creation failed")),
              }
            )
          )}
          className="space-y-4"
        >
          <FieldGroup>
            <Field>
              <FieldLabel>Geography *</FieldLabel>
              <Select
                value={geographyUuid || ""}
                onValueChange={(v: string | null) => {
                  if (v) setValue("geographyUuid", v, { shouldValidate: true })
                  }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select geography" />
                </SelectTrigger>
                <SelectContent>
                  {(geoData?.content ?? []).map((g) => (
                    <SelectItem key={g.geographyUuid} value={g.geographyUuid}>
                      {g.name} ({g.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[errors.geographyUuid]} />
            </Field>
          </FieldGroup>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Adding..." : "Add mapping"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
