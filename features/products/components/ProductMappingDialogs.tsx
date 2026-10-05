"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FieldGroup } from "@/components/ui/field"
import {
  FormTextField,
  FormDateField,
  FormTextareaField,
  FormComboboxField,
} from "@/components/common/form-fields"
import { getApiErrorMessage } from "@/lib/api/api-error"
import {
  useCreateProductGstMapping,
  useCreateProductRelationship,
  useCreateProductFitment,
  useCreateProductGeographyMapping,
} from "../hooks/use-product-mappings"
import { GstHsnCombobox } from "@/features/gst-hsn/components/GstHsnCombobox"
import { GstTaxStructureCombobox } from "@/features/gst-tax-structures/components/GstTaxStructureCombobox"
import { ProductCombobox } from "./ProductCombobox"
import { RelationshipTypeCombobox } from "@/features/relationship-types/components/RelationshipTypeCombobox"
import { VehicleVariantCombobox } from "@/features/vehicle-variants/components/VehicleVariantCombobox"
import { FuelTypeCombobox } from "@/features/fuel-types/components/FuelTypeCombobox"
import { FitmentPositionCombobox } from "@/features/fitment-positions/components/FitmentPositionCombobox"
import { GeographyCombobox } from "@/features/geographies/components/GeographyCombobox"

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
  const createMutation = useCreateProductGstMapping(companyUuid, productUuid)
  const { handleSubmit, control, reset } = useForm<z.infer<typeof gstSchema>>({
    resolver: zodResolver(gstSchema),
    defaultValues: { hsnUuid: "", taxStructureUuid: "", effectiveFrom: "", effectiveTo: "" },
  })

  useEffect(() => {
    if (open)
      reset({ hsnUuid: "", taxStructureUuid: "", effectiveFrom: "", effectiveTo: "" })
  }, [open, reset])

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
            <FormComboboxField
              control={control}
              name="hsnUuid"
              label="HSN *"
              companyUuid={companyUuid}
              Combobox={GstHsnCombobox}
            />
            <FormComboboxField
              control={control}
              name="taxStructureUuid"
              label="Tax Structure *"
              companyUuid={companyUuid}
              Combobox={GstTaxStructureCombobox}
            />
            <FormDateField
              control={control}
              name="effectiveFrom"
              label="Effective From"
            />
            <FormDateField
              control={control}
              name="effectiveTo"
              label="Effective To"
            />
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
  const createMutation = useCreateProductRelationship(companyUuid, productUuid)
  const { handleSubmit, control, reset } = useForm<z.infer<typeof relSchema>>({
    resolver: zodResolver(relSchema),
    defaultValues: { relatedProductUuid: "", relationshipTypeUuid: "", description: "" },
  })

  useEffect(() => {
    if (open) {
      reset({ relatedProductUuid: "", relationshipTypeUuid: "", description: "" })
    }
  }, [open, reset])

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
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
            <FormComboboxField
              control={control}
              name="relatedProductUuid"
              label="Related Product *"
              companyUuid={companyUuid}
              Combobox={ProductCombobox}
              comboboxProps={{ excludeIds: [productUuid] }}
            />
            <FormComboboxField
              control={control}
              name="relationshipTypeUuid"
              label="Relationship Type *"
              companyUuid={companyUuid}
              Combobox={RelationshipTypeCombobox}
            />
            <FormTextareaField
              control={control}
              name="description"
              label="Description"
            />
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
  const createMutation = useCreateProductFitment(companyUuid, productUuid)
  const { handleSubmit, control, reset } = useForm<z.infer<typeof fitmentSchema>>({
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
              <FormComboboxField
                control={control}
                name="variantUuid"
                label="Variant *"
                companyUuid={companyUuid}
                Combobox={VehicleVariantCombobox}
              />
              <FormComboboxField
                control={control}
                name="fuelTypeUuid"
                label="Fuel Type"
                companyUuid={companyUuid}
                Combobox={FuelTypeCombobox}
              />
              <FormTextField
                control={control}
                name="engine"
                label="Engine"
              />
              <FormComboboxField
                control={control}
                name="fitmentPositionUuid"
                label="Fitment Position"
                companyUuid={companyUuid}
                Combobox={FitmentPositionCombobox}
              />
              <FormDateField
                control={control}
                name="yearFrom"
                label="Year From"
              />
              <FormDateField
                control={control}
                name="yearTo"
                label="Year To"
              />
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
  const createMutation = useCreateProductGeographyMapping(
    companyUuid,
    productUuid
  )
  const { handleSubmit, control, reset } = useForm<z.infer<typeof geoSchema>>({
    resolver: zodResolver(geoSchema),
    defaultValues: { geographyUuid: "" },
  })

  useEffect(() => {
    if (open) reset({ geographyUuid: "" })
  }, [open, reset])

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
            <FormComboboxField
              control={control}
              name="geographyUuid"
              label="Geography *"
              companyUuid={companyUuid}
              Combobox={GeographyCombobox}
            />
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
