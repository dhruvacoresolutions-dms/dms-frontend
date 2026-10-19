"use client"

import { useEffect, useMemo } from "react"
import { useForm, useWatch } from "react-hook-form"
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
  requiredLabel,
} from "@/components/common/form-fields"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { applyApiFieldErrors } from "@/lib/api/form-errors"
import {
  optionalName,
  optionalText,
  requiredCode,
  requiredName,
  requiredText,
} from "@/lib/validations/master-data"
import {
  optionalEmail,
  optionalGstin,
  optionalPhone,
} from "@/lib/validations/party"
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

/**
 * Mirrors `CreateDistributorBranchRequest` / `UpdateDistributorBranchRequest`:
 *  - branchCode @NotBlank @Size(max=30) @SafeCode (immutable? no, editable)
 *  - branchName @NotBlank @Size(max=120) @SafeName
 *  - branchType @NotNull, addressLine1 @NotBlank @Size(max=200)
 *  - geographyUuid @NotNull (must resolve to an active REGION), postalCode @NotBlank @Size(max=20)
 *  - contactPerson @Size(max=120) @SafeName, mobileNumber pattern, email @Email
 *  - branchGstin @Size(max=15) and a valid GSTIN when supplied
 *  - warehouseEnabled ↔ storageType must be supplied together, branchGstin
 *    must be a valid GSTIN, effectiveTo must not precede effectiveFrom
 *    (`DistributorBranchService.rules`).
 */
const branchSchema = z
  .object({
    branchCode: requiredCode("Code", 30),
    branchName: requiredName("Name", 120),
    branchType: z.enum([
      "HEAD_OFFICE",
      "BRANCH",
      "WAREHOUSE",
      "DEPOT",
      "DEALER",
      "SERVICE_LOCATION",
    ]),
    isPrimary: z.boolean(),
    addressLine1: requiredText("Address", 200),
    addressLine2: optionalText("Address line 2", 500),
    geographyUuid: z.string().min(1, "Geography is required"),
    postalCode: requiredText("Postal code", 20),
    contactPerson: optionalName("Contact person", 120),
    mobileNumber: optionalPhone("mobile number"),
    email: optionalEmail(254),
    branchGstin: optionalGstin("GSTIN"),
    warehouseEnabled: z.boolean(),
    storageType: z.enum(["AMBIENT", "CHILLED", "FROZEN", "MIXED"]),
    coldChainEnabled: z.boolean(),
    serviceFacilityEnabled: z.boolean(),
    effectiveFrom: z.string().optional(),
    effectiveTo: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (
      values.effectiveFrom &&
      values.effectiveTo &&
      values.effectiveTo < values.effectiveFrom
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["effectiveTo"],
        message: "Effective to cannot precede effective from",
      })
    }
  })

type BranchFormValues = z.infer<typeof branchSchema>

function toFormDefaults(): BranchFormValues {
  return {
    branchCode: "",
    branchName: "",
    branchType: "BRANCH",
    isPrimary: false,
    addressLine1: "",
    addressLine2: "",
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
    effectiveTo: "",
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
  const createMutation = useCreateDistributorBranch(
    companyUuid,
    distributorUuid
  )
  const updateMutation = useUpdateDistributorBranch(
    companyUuid,
    distributorUuid
  )

  const { handleSubmit, control, reset, setError } = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: toFormDefaults(),
  })

  const warehouseEnabled = useWatch({ control, name: "warehouseEnabled" })

  useEffect(() => {
    if (!open) return
    if (branch) {
      reset({
        branchCode: branch.branchCode,
        branchName: branch.branchName,
        branchType: branch.branchType ?? "BRANCH",
        isPrimary: branch.isPrimary ?? false,
        addressLine1: branch.addressLine1 ?? "",
        addressLine2: branch.addressLine2 ?? "",
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
        effectiveTo: branch.effectiveTo ?? "",
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
    const orUndefined = (v?: string) => (v === "" ? undefined : v)
    const payload = {
      branchCode: values.branchCode.trim().toUpperCase(),
      branchName: values.branchName.trim(),
      branchType: values.branchType,
      isPrimary: values.isPrimary,
      addressLine1: values.addressLine1.trim(),
      addressLine2: orUndefined(values.addressLine2?.trim()),
      geographyUuid: values.geographyUuid,
      // The backend only accepts a REGION geography for branches.
      geographyType: "REGION",
      postalCode: values.postalCode.trim(),
      contactPerson: orUndefined(values.contactPerson?.trim()),
      mobileNumber: orUndefined(values.mobileNumber?.trim()),
      email: orUndefined(values.email?.trim()),
      branchGstin: values.branchGstin?.trim()
        ? values.branchGstin.trim().toUpperCase()
        : undefined,
      warehouseEnabled: values.warehouseEnabled,
      // Storage type is only valid when the warehouse flag is on; sending it
      // otherwise is rejected by the backend ("only when warehouse is enabled").
      storageType: values.warehouseEnabled ? values.storageType : undefined,
      coldChainEnabled: values.coldChainEnabled,
      serviceFacilityEnabled: values.serviceFacilityEnabled,
      effectiveFrom: orUndefined(values.effectiveFrom),
      effectiveTo: orUndefined(values.effectiveTo),
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
          onError: (error) => {
            applyApiFieldErrors(error, setError)
            toast.error(getApiErrorMessage(error, "Failed"))
          },
        }
      )
      return
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Branch created")
        handleOpenChange(false)
      },
      onError: (error) => {
        applyApiFieldErrors(error, setError)
        toast.error(getApiErrorMessage(error, "Failed"))
      },
    })
  }

  const storageOptions = useMemo(() => STORAGE_TYPES, [])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Branch" : "Create Branch"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <FieldGroup>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <FormTextField
                control={control}
                name="branchCode"
                label={requiredLabel("Code")}
                maxLength={30}
              />
              <FormTextField
                control={control}
                name="branchName"
                label={requiredLabel("Name")}
                maxLength={120}
              />
              <FormSelectField
                control={control}
                name="branchType"
                label={requiredLabel("Branch Type")}
                options={BRANCH_TYPES}
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
              <FormComboboxField
                control={control}
                name="geographyUuid"
                label={requiredLabel("Geography")}
                companyUuid={companyUuid}
                Combobox={GeographyCombobox}
                comboboxProps={{
                  types: ["REGION"],
                  status: "ACTIVE",
                }}
              />
              <FormTextField
                control={control}
                name="postalCode"
                label={requiredLabel("Postal Code")}
                maxLength={20}
              />
              <FormTextareaField
                control={control}
                name="addressLine1"
                label={requiredLabel("Address")}
                className="lg:col-span-2"
              />
              <FormTextareaField
                control={control}
                name="addressLine2"
                label="Address Line 2"
                className="lg:col-span-2"
              />
              <FormTextField
                control={control}
                name="contactPerson"
                label="Contact Person"
                maxLength={120}
              />
              <FormTextField
                control={control}
                name="mobileNumber"
                label="Mobile Number"
                placeholder="Enter mobile number"
                maxLength={16}
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
                maxLength={15}
              />
              <div className="space-y-1.5">
                <FormSelectField
                  control={control}
                  name="storageType"
                  label={requiredLabel("Storage Type", warehouseEnabled)}
                  options={storageOptions}
                  disabled={!warehouseEnabled}
                />
                {!warehouseEnabled && (
                  <p className="text-xs text-muted-foreground">
                    Enable Warehouse to choose a storage type.
                  </p>
                )}
              </div>
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
