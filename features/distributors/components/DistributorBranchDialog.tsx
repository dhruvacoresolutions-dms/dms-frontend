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
  FormComboboxField,
  FormDateField,
  FormSelectField,
  FormSwitchField,
  FormTextareaField,
  FormTextField,
} from "@/components/common/form-fields"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { GeographyCombobox } from "@/features/geographies/components/GeographyCombobox"
import { useCreateDistributorBranch } from "../hooks/use-create-distributor-branch"
import { useUpdateDistributorBranch } from "../hooks/use-update-distributor-branch"
import type {
  BranchType,
  DistributorBranchResponse,
  StorageType,
} from "../api/distributor.types"

const BRANCH_TYPES: { value: BranchType; label: string }[] = [
  { value: "HEAD_OFFICE", label: "Head Office" },
  { value: "BRANCH", label: "Branch" },
  { value: "WAREHOUSE", label: "Warehouse" },
  { value: "DEPOT", label: "Depot" },
  { value: "DEALER", label: "Dealer" },
  { value: "SERVICE_LOCATION", label: "Service Location" },
]

const STORAGE_TYPES: { value: StorageType; label: string }[] = [
  { value: "AMBIENT", label: "Ambient" },
  { value: "CHILLED", label: "Chilled" },
  { value: "FROZEN", label: "Frozen" },
  { value: "MIXED", label: "Mixed" },
]

const phonePattern = /^$|^\+?[0-9]{7,15}$/

const branchSchema = z.object({
  branchCode: z.string().min(1, "Code is required").max(40),
  branchName: z.string().min(1, "Name is required").max(200),
  branchType: z.enum([
    "HEAD_OFFICE",
    "BRANCH",
    "WAREHOUSE",
    "DEPOT",
    "DEALER",
    "SERVICE_LOCATION",
  ]),
  isPrimary: z.boolean(),
  addressLine1: z.string().max(500).optional(),
  geographyUuid: z.string().optional(),
  postalCode: z.string().max(20).optional(),
  contactPerson: z.string().max(150).optional(),
  mobileNumber: z
    .string()
    .regex(phonePattern, "Enter a valid mobile number")
    .optional(),
  email: z
    .string()
    .max(254)
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: "Enter a valid email",
    })
    .optional(),
  branchGstin: z.string().max(20).optional(),
  warehouseEnabled: z.boolean(),
  storageType: z.enum(["AMBIENT", "CHILLED", "FROZEN", "MIXED"]),
  coldChainEnabled: z.boolean(),
  serviceFacilityEnabled: z.boolean(),
  effectiveFrom: z.string().optional(),
})

type BranchFormValues = z.infer<typeof branchSchema>

function toFormDefaults(): BranchFormValues {
  return {
    branchCode: "",
    branchName: "",
    branchType: "BRANCH",
    isPrimary: false,
    addressLine1: "",
    geographyUuid: "",
    postalCode: "",
    contactPerson: "",
    mobileNumber: "",
    email: "",
    branchGstin: "",
    warehouseEnabled: false,
    storageType: "AMBIENT",
    coldChainEnabled: false,
    serviceFacilityEnabled: false,
    effectiveFrom: "",
  }
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  distributorUuid: string
  branch?: DistributorBranchResponse | null
}

export function DistributorBranchDialog({
  open,
  onOpenChange,
  companyUuid,
  distributorUuid,
  branch,
}: Props) {
  const isEdit = !!branch
  const createMutation = useCreateDistributorBranch(companyUuid, distributorUuid)
  const updateMutation = useUpdateDistributorBranch(companyUuid, distributorUuid)

  const { handleSubmit, control, reset } = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: toFormDefaults(),
  })

  useEffect(() => {
    if (!open) return
    if (branch) {
      reset({
        branchCode: branch.branchCode,
        branchName: branch.branchName,
        branchType: branch.branchType ?? "BRANCH",
        isPrimary: branch.isPrimary ?? false,
        addressLine1: branch.addressLine1 ?? "",
        geographyUuid: branch.geographyUuid ?? "",
        postalCode: branch.postalCode ?? "",
        contactPerson: branch.contactPerson ?? "",
        mobileNumber: branch.mobileNumber ?? "",
        email: branch.email ?? "",
        branchGstin: branch.branchGstin ?? "",
        warehouseEnabled: branch.warehouseEnabled ?? false,
        storageType: branch.storageType ?? "AMBIENT",
        coldChainEnabled: branch.coldChainEnabled ?? false,
        serviceFacilityEnabled: branch.serviceFacilityEnabled ?? false,
        effectiveFrom: branch.effectiveFrom ?? "",
      })
    } else {
      reset(toFormDefaults())
    }
  }, [open, branch, reset])

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = (values: BranchFormValues) => {
    const payload = {
      branchCode: values.branchCode.trim(),
      branchName: values.branchName.trim(),
      branchType: values.branchType,
      isPrimary: values.isPrimary,
      addressLine1: values.addressLine1?.trim() || undefined,
      geographyUuid: values.geographyUuid || undefined,
      geographyType: values.geographyUuid ? "REGION" : undefined,
      postalCode: values.postalCode?.trim() || undefined,
      contactPerson: values.contactPerson?.trim() || undefined,
      mobileNumber: values.mobileNumber?.trim() || undefined,
      email: values.email?.trim() || undefined,
      branchGstin: values.branchGstin?.trim() || undefined,
      warehouseEnabled: values.warehouseEnabled,
      storageType: values.storageType,
      coldChainEnabled: values.coldChainEnabled,
      serviceFacilityEnabled: values.serviceFacilityEnabled,
      effectiveFrom: values.effectiveFrom || undefined,
    }

    if (isEdit && branch) {
      updateMutation.mutate(
        {
          branchUuid: branch.branchUuid,
          input: { ...payload, version: branch.version },
        },
        {
          onSuccess: () => {
            toast.success("Branch updated")
            handleOpenChange(false)
          },
          onError: (error) => toast.error(getApiErrorMessage(error, "Failed")),
        }
      )
      return
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Branch created")
        handleOpenChange(false)
      },
      onError: (error) => toast.error(getApiErrorMessage(error, "Failed")),
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Branch" : "Create Branch"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <FormTextField
                control={control}
                name="branchCode"
                label="Code *"
                maxLength={40}
              />
              <FormTextField
                control={control}
                name="branchName"
                label="Name *"
                maxLength={200}
              />
              <FormSelectField
                control={control}
                name="branchType"
                label="Branch Type"
                options={BRANCH_TYPES}
              />
              <FormDateField
                control={control}
                name="effectiveFrom"
                label="Effective From"
              />
              <FormComboboxField
                control={control}
                name="geographyUuid"
                label="Geography"
                companyUuid={companyUuid}
                Combobox={GeographyCombobox}
              />
              <FormTextField
                control={control}
                name="postalCode"
                label="Postal Code"
                maxLength={20}
              />
              <FormTextareaField
                control={control}
                name="addressLine1"
                label="Address"
                className="lg:col-span-2"
              />
              <FormTextField
                control={control}
                name="contactPerson"
                label="Contact Person"
                maxLength={150}
              />
              <FormTextField
                control={control}
                name="mobileNumber"
                label="Mobile Number"
                placeholder="Enter mobile number"
              />
              <FormTextField
                control={control}
                name="email"
                label="Email"
                type="email"
                maxLength={254}
              />
              <FormTextField
                control={control}
                name="branchGstin"
                label="Branch GSTIN"
                maxLength={20}
              />
              <FormSelectField
                control={control}
                name="storageType"
                label="Storage Type"
                options={STORAGE_TYPES}
              />
            </div>
          </FieldGroup>

          <FieldGroup>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <FormSwitchField
                control={control}
                name="isPrimary"
                label="Primary Branch"
              />
              <FormSwitchField
                control={control}
                name="warehouseEnabled"
                label="Warehouse"
              />
              <FormSwitchField
                control={control}
                name="coldChainEnabled"
                label="Cold Chain"
              />
              <FormSwitchField
                control={control}
                name="serviceFacilityEnabled"
                label="Service Facility"
              />
            </div>
          </FieldGroup>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Save changes" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
