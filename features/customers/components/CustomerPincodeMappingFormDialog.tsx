"use client"

import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, MapPin } from "lucide-react"
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
import {
  FormComboboxField,
  FormSelectField,
  FormTextareaField,
  FormTextField,
  requiredLabel,
} from "@/components/common/form-fields"
import { GeographyCombobox } from "@/features/geographies/components/GeographyCombobox"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { applyApiFieldErrors } from "@/lib/api/form-errors"
import { customerPincode } from "../lib/customer-validation"
import { useCreateCustomerPincodeMapping } from "../hooks/use-create-customer-pincode-mapping"
import { useUpdateCustomerPincodeMapping } from "../hooks/use-update-customer-pincode-mapping"
import { useResolvePincode } from "../hooks/use-resolve-pincode"
import type {
  CustomerPincodeMapping,
  CustomerPincodeMappingStatus,
  CustomerPincodeRecordStatus,
} from "../api/customer.types"

const STATUS_OPTIONS: {
  value: CustomerPincodeMappingStatus
  label: string
}[] = [
  { value: "MAPPED", label: "Mapped — territory assigned" },
  { value: "MAPPING_PENDING", label: "Mapping pending" },
  { value: "REVIEW", label: "Needs review" },
]

const RECORD_STATUS_OPTIONS: {
  value: CustomerPincodeRecordStatus
  label: string
}[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
]

const schema = z
  .object({
    pincode: customerPincode(),
    status: z.enum(["MAPPED", "MAPPING_PENDING", "REVIEW"]),
    territoryUuid: z.string().optional(),
    notes: z.string().trim().optional(),
    recordStatus: z.enum(["ACTIVE", "INACTIVE"]),
  })
  .superRefine((values, ctx) => {
    if (values.status === "MAPPED" && !values.territoryUuid?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["territoryUuid"],
        message: "Territory is required when the status is MAPPED",
      })
    }
    if (values.status !== "MAPPED" && values.territoryUuid?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["territoryUuid"],
        message: "Clear the territory for pending/review mappings",
      })
    }
  })

type FormValues = z.infer<typeof schema>

const emptyValues: FormValues = {
  pincode: "",
  status: "MAPPED",
  territoryUuid: "",
  notes: "",
  recordStatus: "ACTIVE",
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  mapping?: CustomerPincodeMapping | null
}

export function CustomerPincodeMappingFormDialog({
  open,
  onOpenChange,
  companyUuid,
  mapping,
}: Props) {
  const isEdit = !!mapping
  const createMutation = useCreateCustomerPincodeMapping(companyUuid)
  const updateMutation = useUpdateCustomerPincodeMapping(companyUuid)

  const { control, handleSubmit, reset, setError, setValue } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: emptyValues,
    })

  const status = useWatch({ control, name: "status" })
  const pincode = useWatch({ control, name: "pincode" })
  const resolution = useResolvePincode(companyUuid, pincode)

  useEffect(() => {
    if (!open) return
    reset(
      mapping
        ? {
            pincode: mapping.pincode,
            status: mapping.status,
            territoryUuid: mapping.territoryUuid ?? "",
            notes: mapping.notes ?? "",
            recordStatus: mapping.recordStatus,
          }
        : emptyValues
    )
  }, [open, mapping, reset])

  useEffect(() => {
    if (status !== "MAPPED") setValue("territoryUuid", "")
  }, [status, setValue])

  const isPending = createMutation.isPending || updateMutation.isPending
  const pathCodes = (resolution.data?.geographyPath ?? [])
    .map((p) => p.code)
    .reverse()

  const onSubmit = (values: FormValues) => {
    const input = {
      pincode: values.pincode.trim(),
      status: values.status,
      territoryUuid:
        values.status === "MAPPED" ? values.territoryUuid?.trim() : undefined,
      notes: values.notes?.trim() || undefined,
      recordStatus: values.recordStatus,
      version: mapping?.version,
    }

    const onError = (err: unknown) => {
      applyApiFieldErrors(err, setError)
      toast.error(getApiErrorMessage(err, "Failed to save pincode mapping"))
    }

    if (isEdit && mapping) {
      updateMutation.mutate(
        { uuid: mapping.uuid, input },
        {
          onSuccess: () => {
            toast.success("Pincode mapping updated")
            onOpenChange(false)
          },
          onError,
        }
      )
      return
    }

    createMutation.mutate(input, {
      onSuccess: () => {
        toast.success("Pincode mapping created")
        onOpenChange(false)
      },
      onError,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit pincode mapping" : "Create pincode mapping"}
          </DialogTitle>
          <DialogDescription>
            A pincode maps to at most one territory. Only MAPPED rows carry a
            territory — pending and review rows must stay unassigned.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FieldGroup>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormTextField
                control={control}
                name="pincode"
                label={requiredLabel("Pincode")}
                maxLength={6}
                placeholder="6-digit pincode"
              />
              <FormSelectField
                control={control}
                name="status"
                label={requiredLabel("Mapping Status")}
                options={STATUS_OPTIONS}
              />
              <div className="sm:col-span-2">
                <FormComboboxField
                  control={control}
                  name="territoryUuid"
                  label={requiredLabel("Territory", status === "MAPPED")}
                  companyUuid={companyUuid}
                  Combobox={GeographyCombobox}
                  disabled={status !== "MAPPED"}
                  comboboxProps={{
                    types: ["TERRITORY"],
                    status: "ACTIVE",
                    placeholder: "Select territory...",
                  }}
                />
              </div>
              <div className="sm:col-span-2">
                <MappingHint
                  pincode={pincode}
                  isResolving={resolution.isFetching}
                  status={resolution.data?.status}
                  pathCodes={pathCodes}
                />
              </div>
              <FormSelectField
                control={control}
                name="recordStatus"
                label={requiredLabel("Record Status")}
                options={RECORD_STATUS_OPTIONS}
              />
              <FormTextareaField
                control={control}
                name="notes"
                label="Notes"
                rows={3}
                className="sm:col-span-2"
              />
            </div>
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save mapping"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function MappingHint({
  pincode,
  isResolving,
  status,
  pathCodes,
}: {
  pincode?: string
  isResolving: boolean
  status?: string
  pathCodes: string[]
}) {
  if (!pincode || !/^[1-9][0-9]{5}$/.test(pincode)) {
    return (
      <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="size-3.5" aria-hidden="true" />
        Enter a 6-digit pincode to preview the current territory mapping.
      </p>
    )
  }

  if (isResolving) {
    return (
      <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        Checking existing mapping...
      </p>
    )
  }

  if (status === "MAPPED") {
    return (
      <p className="inline-flex flex-wrap items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
        <MapPin className="size-3.5" aria-hidden="true" />
        Currently mapped
        {pathCodes.length ? ` to ${pathCodes.join(" / ")}` : ""}. Saving replaces
        the existing mapping.
      </p>
    )
  }

  return (
    <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <MapPin className="size-3.5" aria-hidden="true" />
      {status === "NOT_CONFIGURED"
        ? "No mapping exists for this pincode yet."
        : `This pincode is currently ${String(status).toLowerCase().replaceAll("_", " ")}.`}
    </p>
  )
}
