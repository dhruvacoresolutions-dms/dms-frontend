"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Building2, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import {
  FormSwitchField,
  FormTextField,
  requiredLabel,
} from "@/components/common/form-fields"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { applyApiFieldErrors } from "@/lib/api/form-errors"
import {
  optionalText,
  requiredName,
  requiredText,
} from "@/lib/validations/master-data"
import { useGodown } from "../hooks/use-godown"
import { useCreateGodown } from "../hooks/use-create-godown"
import { useUpdateGodown } from "../hooks/use-update-godown"
import type { CreateGodownRequest, UpdateGodownRequest } from "../api/inventory.types"

const godownSchema = z.object({
  godownCode: z
    .string()
    .trim()
    .max(30, "Code must not exceed 30 characters")
    .regex(/^[A-Za-z0-9]*$/, "Only letters and numbers are allowed"),
  godownName: requiredName("Godown name", 120),
  addressLine1: requiredText("Address line 1", 200),
  addressLine2: optionalText("Address line 2", 200),
  addressLine3: optionalText("Address line 3", 200),
  state: requiredText("State", 120),
  city: requiredText("City", 120),
  postalCode: z
    .string()
    .trim()
    .regex(/^[1-9][0-9]{5}$/, "Postal code must be 6 digits and cannot start with 0"),
  contactNumber: z
    .string()
    .trim()
    .regex(/^[6-9][0-9]{9}$/, "Contact number must be 10 digits starting with 6-9"),
  contactPerson: requiredName("Contact person", 120),
  isDefault: z.boolean(),
  isSalesman: z.boolean(),
})

type GodownFormValues = z.infer<typeof godownSchema>

function emptyValues(): GodownFormValues {
  return {
    godownCode: "",
    godownName: "",
    addressLine1: "",
    addressLine2: "",
    addressLine3: "",
    state: "",
    city: "",
    postalCode: "",
    contactNumber: "",
    contactPerson: "",
    isDefault: false,
    isSalesman: false,
  }
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  distributorUuid: string
  /** Set to edit; omit to create. */
  godownUuid?: string | null
  /** Distributor admins may only edit address/contact fields. */
  isDistributorUser?: boolean
}

export function GodownFormDialog({
  open,
  onOpenChange,
  companyUuid,
  distributorUuid,
  godownUuid,
  isDistributorUser = false,
}: Props) {
  const isEdit = !!godownUuid
  const { data: godown, isLoading: isDetailLoading } = useGodown(
    companyUuid,
    distributorUuid,
    godownUuid ?? ""
  )
  const createMutation = useCreateGodown(companyUuid, distributorUuid)
  const updateMutation = useUpdateGodown(companyUuid, distributorUuid)

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<GodownFormValues>({
    resolver: zodResolver(godownSchema),
    defaultValues: emptyValues(),
  })

  useEffect(() => {
    if (!open) return
    if (isEdit && godown) {
      reset({
        godownCode: godown.godownCode ?? "",
        godownName: godown.godownName ?? "",
        addressLine1: godown.addressLine1 ?? "",
        addressLine2: godown.addressLine2 ?? "",
        addressLine3: godown.addressLine3 ?? "",
        state: godown.state ?? "",
        city: godown.city ?? "",
        postalCode: godown.postalCode ?? "",
        contactNumber: godown.contactNumber ?? "",
        contactPerson: godown.contactPerson ?? "",
        isDefault: !!godown.isDefault,
        isSalesman: !!godown.isSalesman,
      })
      return
    }
    if (!isEdit) reset(emptyValues())
  }, [open, isEdit, godown, reset])

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    (isEdit && isDetailLoading)

  const close = (next: boolean) => {
    if (!next) reset(emptyValues())
    onOpenChange(next)
  }

  const onSubmit = (values: GodownFormValues) => {
    const shared = {
      addressLine1: values.addressLine1.trim(),
      addressLine2: values.addressLine2?.trim() || null,
      addressLine3: values.addressLine3?.trim() || null,
      state: values.state.trim(),
      city: values.city.trim(),
      postalCode: values.postalCode.trim(),
      contactNumber: values.contactNumber.trim(),
      contactPerson: values.contactPerson.trim(),
    }

    if (isEdit) {
      if (!godown) return
      const base: UpdateGodownRequest = {
        ...shared,
        version: godown.version,
      }

      // Distributor admins may only change the address/contact block. Omitting
      // the protected fields keeps the stored code, name, branch and flags.
      const input: UpdateGodownRequest = isDistributorUser
        ? base
        : {
            ...base,
            godownCode: values.godownCode.trim().toUpperCase(),
            godownName: values.godownName.trim(),
            isDefault: values.isDefault,
            isSalesman: values.isSalesman,
          }

      updateMutation.mutate(
        { godownUuid: godownUuid as string, input },
        {
          onSuccess: () => {
            toast.success("Godown updated")
            close(false)
          },
          onError: (error) => {
            applyApiFieldErrors(error, setError)
            toast.error(getApiErrorMessage(error, "Could not update godown"))
          },
        }
      )
      return
    }

    const input: CreateGodownRequest = {
      ...shared,
      godownName: values.godownName.trim(),
      ...(isDistributorUser
        ? {}
        : { isDefault: values.isDefault, isSalesman: values.isSalesman }),
    }

    createMutation.mutate(input, {
      onSuccess: (created) => {
        toast.success(`Godown ${created.godownCode} created`)
        close(false)
      },
      onError: (error) => {
        applyApiFieldErrors(error, setError)
        toast.error(getApiErrorMessage(error, "Could not create godown"))
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="size-4" aria-hidden="true" />
            {isEdit ? "Edit godown" : "Create godown"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the godown address and contact details."
              : "Godown codes are generated automatically. Country is fixed to India."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {isEdit && godown ? (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
              <Badge variant="outline" className="font-mono">
                {godown.godownCode}
              </Badge>
              <span className="font-medium">{godown.godownName}</span>
              {godown.isMain ? (
                <Badge variant="secondary">Main godown</Badge>
              ) : null}
              {godown.branchCode ?? godown.distributorBranchCode ? (
                <span className="text-xs text-muted-foreground">
                  Branch {godown.branchCode ?? godown.distributorBranchCode}
                </span>
              ) : null}
            </div>
          ) : null}

          {!isDistributorUser ? (
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              {isEdit ? (
                <FormTextField
                  control={control}
                  name="godownCode"
                  label={requiredLabel("Godown code")}
                  placeholder="Enter code"
                  disabled={isPending}
                  maxLength={30}
                />
              ) : null}
              <FormTextField
                control={control}
                name="godownName"
                label={requiredLabel("Godown name")}
                placeholder="Enter godown name"
                disabled={isPending}
                className={isEdit ? undefined : "sm:col-span-2"}
              />
            </FieldGroup>
          ) : null}

          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <FormTextField
              control={control}
              name="addressLine1"
              label={requiredLabel("Address line 1")}
              placeholder="Enter address line 1"
              disabled={isPending}
              className="sm:col-span-2"
            />
            <FormTextField
              control={control}
              name="addressLine2"
              label="Address line 2"
              placeholder="Enter address line 2"
              disabled={isPending}
            />
            <FormTextField
              control={control}
              name="addressLine3"
              label="Address line 3"
              placeholder="Enter address line 3"
              disabled={isPending}
            />
            <FormTextField
              control={control}
              name="city"
              label={requiredLabel("City")}
              placeholder="Enter city"
              disabled={isPending}
            />
            <FormTextField
              control={control}
              name="state"
              label={requiredLabel("State")}
              placeholder="Enter state"
              disabled={isPending}
            />
            <FormTextField
              control={control}
              name="postalCode"
              label={requiredLabel("Postal code")}
              placeholder="Enter 6-digit postal code"
              disabled={isPending}
              maxLength={6}
              inputMode="numeric"
            />
            <FormTextField
              control={control}
              name="contactPerson"
              label={requiredLabel("Contact person")}
              placeholder="Enter contact person"
              disabled={isPending}
            />
            <FormTextField
              control={control}
              name="contactNumber"
              label={requiredLabel("Contact number")}
              placeholder="Enter 10-digit mobile number"
              disabled={isPending}
              maxLength={10}
              inputMode="tel"
            />
          </FieldGroup>

          {!isDistributorUser ? (
            <div className="grid gap-4 rounded-lg border bg-muted/20 p-3 sm:grid-cols-2">
              <FormSwitchField
                control={control}
                name="isDefault"
                label="Default godown"
                hint="Only one default godown is allowed per distributor."
                disabled={isPending}
              />
              <FormSwitchField
                control={control}
                name="isSalesman"
                label="Salesman godown"
                hint="Used as a salesman stock location."
                disabled={isPending}
              />
            </div>
          ) : (
            <p className="flex items-start gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              As a distributor administrator you can edit the address and
              contact fields only. The godown name, code, branch and flags are
              managed by the company.
            </p>
          )}

          {errors.root?.message ? (
            <p className="text-sm text-destructive">{errors.root.message}</p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => close(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !distributorUuid}>
              {isPending ? <Spinner className="mr-2 size-4" /> : null}
              {isEdit ? "Save changes" : "Create godown"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
