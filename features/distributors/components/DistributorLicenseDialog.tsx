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
  FormTextField,
} from "@/components/common/form-fields"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { DistributorBranchCombobox } from "./DistributorBranchCombobox"
import { useCreateDistributorLicense } from "../hooks/use-create-distributor-license"
import { useUpdateDistributorLicense } from "../hooks/use-update-distributor-license"
import type {
  DistributorLicenseResponse,
  LicenseType,
} from "../api/distributor.types"

const LICENSE_TYPES: { value: LicenseType; label: string }[] = [
  { value: "DRUG", label: "Drug" },
  { value: "FOOD_TRADE", label: "Food Trade" },
  { value: "OTHER", label: "Other" },
]

const licenseSchema = z
  .object({
    licenseType: z.enum(["DRUG", "FOOD_TRADE", "OTHER"]),
    licenseNumber: z.string().min(1, "License number is required").max(80),
    issuingAuthority: z.string().max(200).optional(),
    validFrom: z.string().optional(),
    validTo: z.string().optional(),
    branchUuid: z.string().optional(),
  })
  .refine(
    (v) => !v.validFrom || !v.validTo || v.validTo >= v.validFrom,
    { message: "Valid To must be on or after Valid From", path: ["validTo"] }
  )

type LicenseFormValues = z.infer<typeof licenseSchema>

function toFormDefaults(): LicenseFormValues {
  return {
    licenseType: "DRUG",
    licenseNumber: "",
    issuingAuthority: "",
    validFrom: "",
    validTo: "",
    branchUuid: "",
  }
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  distributorUuid: string
  license?: DistributorLicenseResponse | null
}

export function DistributorLicenseDialog({
  open,
  onOpenChange,
  companyUuid,
  distributorUuid,
  license,
}: Props) {
  const isEdit = !!license
  const createMutation = useCreateDistributorLicense(companyUuid, distributorUuid)
  const updateMutation = useUpdateDistributorLicense(companyUuid, distributorUuid)

  const { handleSubmit, control, reset } = useForm<LicenseFormValues>({
    resolver: zodResolver(licenseSchema),
    defaultValues: toFormDefaults(),
  })

  useEffect(() => {
    if (!open) return
    if (license) {
      reset({
        licenseType: license.licenseType,
        licenseNumber: license.licenseNumber,
        issuingAuthority: license.issuingAuthority ?? "",
        validFrom: license.validFrom ?? "",
        validTo: license.validTo ?? "",
        branchUuid: license.branchUuid ?? "",
      })
    } else {
      reset(toFormDefaults())
    }
  }, [open, license, reset])

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = (values: LicenseFormValues) => {
    const payload = {
      licenseType: values.licenseType,
      licenseNumber: values.licenseNumber.trim(),
      issuingAuthority: values.issuingAuthority?.trim() || undefined,
      validFrom: values.validFrom || undefined,
      validTo: values.validTo || undefined,
      branchUuid: values.branchUuid || undefined,
    }

    if (isEdit && license) {
      updateMutation.mutate(
        {
          licenseUuid: license.licenseUuid,
          input: { ...payload, version: license.version },
        },
        {
          onSuccess: () => {
            toast.success("License updated")
            handleOpenChange(false)
          },
          onError: (error) => toast.error(getApiErrorMessage(error, "Failed")),
        }
      )
      return
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("License created")
        handleOpenChange(false)
      },
      onError: (error) => toast.error(getApiErrorMessage(error, "Failed")),
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit License" : "Create License"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <FormSelectField
                control={control}
                name="licenseType"
                label="License Type"
                options={LICENSE_TYPES}
              />
              <FormTextField
                control={control}
                name="licenseNumber"
                label="License Number *"
                maxLength={80}
              />
              <FormTextField
                control={control}
                name="issuingAuthority"
                label="Issuing Authority"
                maxLength={200}
                className="lg:col-span-2"
              />
              <FormDateField
                control={control}
                name="validFrom"
                label="Valid From"
              />
              <FormDateField control={control} name="validTo" label="Valid To" />
              <FormComboboxField
                control={control}
                name="branchUuid"
                label="Branch"
                companyUuid={companyUuid}
                Combobox={DistributorBranchCombobox}
                comboboxProps={{ distributorUuid }}
                className="lg:col-span-2"
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
