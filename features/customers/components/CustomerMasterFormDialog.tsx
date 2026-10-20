"use client"

import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field"
import {
  FormComboboxField,
  FormDateField,
  FormNumberField,
  FormSelectField,
  FormTextareaField,
  FormTextField,
  requiredLabel,
} from "@/components/common/form-fields"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { applyApiFieldErrors } from "@/lib/api/form-errors"
import {
  optionalText,
  requiredCode,
  requiredName,
} from "@/lib/validations/master-data"
import { CustomerTypeCombobox } from "./CustomerTypeCombobox"
import { CustomerMasterKindCombobox } from "./CustomerMasterCombobox"
import { useCreateCustomerMaster } from "../hooks/use-create-customer-master"
import { useUpdateCustomerMaster } from "../hooks/use-update-customer-master"
import { useCustomerLookupTypes } from "../hooks/use-customer-lookup-types"
import type {
  CustomerMasterRequest,
  CustomerMasterResponse,
  CustomerLookupType,
} from "../api/customer.types"
import type { CustomerMasterConfig } from "../lib/customer-master-config"

const schema = z
  .object({
    code: requiredCode("Code", 50),
    name: requiredName("Name", 150),
    description: optionalText("Description", 500),
    displayOrder: z.coerce.number().int().min(0, "Display order cannot be negative"),
    status: z.enum(["ACTIVE", "INACTIVE"]),
    effectiveFrom: z.string().optional(),
    effectiveTo: z.string().optional(),
    customerTypeUuid: z.string().optional(),
    parentUuid: z.string().optional(),
    rankLevel: z.coerce.number().int().min(0).optional(),
    lookupType: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    // `CustomerMasterService.validate`: Effective From must be on or before
    // Effective To. ISO date strings compare lexicographically.
    if (
      values.effectiveFrom &&
      values.effectiveTo &&
      values.effectiveFrom > values.effectiveTo
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["effectiveTo"],
        message: "Effective To must be on or after Effective From",
      })
    }
  })

type FormValues = z.infer<typeof schema>

const emptyValues: FormValues = {
  code: "",
  name: "",
  description: "",
  displayOrder: 0,
  status: "ACTIVE",
  effectiveFrom: "",
  effectiveTo: "",
  customerTypeUuid: "",
  parentUuid: "",
  rankLevel: undefined,
  lookupType: "",
}

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
]

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  config: CustomerMasterConfig
  master?: CustomerMasterResponse | null
}

export function CustomerMasterFormDialog({
  open,
  onOpenChange,
  companyUuid,
  config,
  master,
}: Props) {
  const isEdit = !!master
  const createMutation = useCreateCustomerMaster(companyUuid, config.kind)
  const updateMutation = useUpdateCustomerMaster(companyUuid, config.kind)
  const { data: lookupTypes } = useCustomerLookupTypes(companyUuid)

  const lookupTypeOptions = useMemo(
    () =>
      (lookupTypes ?? []).map((t) => ({ value: t.code, label: t.label })),
    [lookupTypes]
  )

  const { control, handleSubmit, reset, setError } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (!open) return
    reset(
      master
        ? {
            code: master.code ?? "",
            name: master.name ?? "",
            description: master.description ?? "",
            displayOrder: master.displayOrder ?? 0,
            status: master.status ?? "ACTIVE",
            effectiveFrom: master.effectiveFrom ?? "",
            effectiveTo: master.effectiveTo ?? "",
            customerTypeUuid: master.customerTypeUuid ?? "",
            parentUuid: master.parentUuid ?? "",
            rankLevel: master.rankLevel ?? undefined,
            lookupType: master.lookupType ?? "",
          }
        : emptyValues
    )
  }, [open, master, reset])

  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = (values: FormValues) => {
    if (config.requiresCustomerType && !values.customerTypeUuid?.trim()) {
      setError("customerTypeUuid", {
        type: "manual",
        message: "Customer type is required",
      })
      return
    }
    if (config.requiresLookupType && !values.lookupType?.trim()) {
      setError("lookupType", {
        type: "manual",
        message: "Lookup type is required",
      })
      return
    }

    const orUndefined = (v?: string) => (v?.trim() ? v.trim() : undefined)

    const payload: CustomerMasterRequest = {
      code: values.code.trim().toUpperCase(),
      name: values.name.trim(),
      description: orUndefined(values.description),
      displayOrder: values.displayOrder,
      status: values.status,
      effectiveFrom: orUndefined(values.effectiveFrom),
      effectiveTo: orUndefined(values.effectiveTo),
      customerTypeUuid: config.requiresCustomerType
        ? orUndefined(values.customerTypeUuid)
        : undefined,
      parentUuid: config.allowsParent
        ? orUndefined(values.parentUuid)
        : undefined,
      rankLevel: config.hasRankLevel ? values.rankLevel : undefined,
      lookupType: config.requiresLookupType
        ? (orUndefined(values.lookupType) as CustomerLookupType | undefined)
        : undefined,
      version: master?.version,
    }

    const onError = (err: unknown) => {
      applyApiFieldErrors(err, setError)
      toast.error(getApiErrorMessage(err, `Failed to save ${config.singular.toLowerCase()}`))
    }

    if (isEdit && master) {
      updateMutation.mutate(
        { uuid: master.uuid, input: payload },
        {
          onSuccess: () => {
            toast.success(`${config.singular} updated`)
            onOpenChange(false)
          },
          onError,
        }
      )
      return
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success(`${config.singular} created`)
        onOpenChange(false)
      },
      onError,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Edit ${config.singular}` : `Create ${config.singular}`}
          </DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FieldGroup>
            <FieldSet>
              <FieldLegend>Details</FieldLegend>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormTextField
                  control={control}
                  name="code"
                  label={requiredLabel("Code")}
                  maxLength={50}
                />
                <FormTextField
                  control={control}
                  name="name"
                  label={requiredLabel("Name")}
                  maxLength={150}
                />
                <FormTextareaField
                  control={control}
                  name="description"
                  label="Description"
                  rows={2}
                  className="sm:col-span-2"
                />
                <FormNumberField
                  control={control}
                  name="displayOrder"
                  label="Display Order"
                  min={0}
                />
                <FormSelectField
                  control={control}
                  name="status"
                  label={requiredLabel("Status")}
                  options={STATUS_OPTIONS}
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
              </div>
            </FieldSet>

            {config.requiresCustomerType ||
            config.allowsParent ||
            config.hasRankLevel ||
            config.requiresLookupType ? (
              <FieldSet>
                <FieldLegend>Classification rules</FieldLegend>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {config.requiresCustomerType ? (
                    <FormComboboxField
                      control={control}
                      name="customerTypeUuid"
                      label={requiredLabel("Customer Type")}
                      companyUuid={companyUuid}
                      Combobox={CustomerTypeCombobox}
                    />
                  ) : null}
                  {config.allowsParent ? (
                    <FormComboboxField
                      control={control}
                      name="parentUuid"
                      label="Parent"
                      companyUuid={companyUuid}
                      Combobox={CustomerMasterKindCombobox}
                      comboboxProps={{
                        kind: config.kind,
                        entityLabel: config.singular,
                        excludeIds: master ? [master.uuid] : [],
                        placeholder: "No parent (top level)",
                      }}
                    />
                  ) : null}
                  {config.hasRankLevel ? (
                    <FormNumberField
                      control={control}
                      name="rankLevel"
                      label="Rank Level"
                      min={0}
                    />
                  ) : null}
                  {config.requiresLookupType ? (
                    <FormSelectField
                      control={control}
                      name="lookupType"
                      label={requiredLabel("Lookup Type")}
                      options={lookupTypeOptions}
                    />
                  ) : null}
                </div>
              </FieldSet>
            ) : null}
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
              {isPending ? "Saving..." : `Save ${config.singular.toLowerCase()}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
