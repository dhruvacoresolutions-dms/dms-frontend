"use client"

import * as React from "react"
import { useEffect, useMemo, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  FormSelectField,
  FormTextareaField,
  FormTextField,
} from "@/components/common/form-fields"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { useGeography } from "../hooks/use-geography"
import { useGeographies } from "../hooks/use-geographies"
import { useCreateGeography } from "../hooks/use-create-geography"
import { useUpdateGeography } from "../hooks/use-update-geography"
import type { GeographyType } from "../api/geography.types"

const GEOGRAPHY_HIERARCHY = [
  "COUNTRY",
  "ZONE",
  "STATE",
  "REGION",
  "TERRITORY",
  "BEAT",
] as const

const GEOGRAPHY_TYPE_OPTIONS = [
  { value: "COUNTRY", label: "Country" },
  { value: "ZONE", label: "Zone" },
  { value: "STATE", label: "State" },
  { value: "REGION", label: "Region" },
  { value: "TERRITORY", label: "Territory" },
  { value: "BEAT", label: "Beat" },
] as const

const geoSchema = z
  .object({
    code: z
      .string()
      .min(1, "Code is required")
      .max(50)
      .regex(/^[A-Za-z0-9_-]+$/, "Invalid code"),
    name: z.string().min(1, "Name is required").max(160),
    type: z.enum(
      ["COUNTRY", "ZONE", "STATE", "REGION", "TERRITORY", "BEAT"],
      { required_error: "Type is required" }
    ),
    parentType: z
      .enum(["COUNTRY", "ZONE", "STATE", "REGION", "TERRITORY", "BEAT"])
      .optional(),
    parentUuid: z.string().optional(),
    description: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type !== "COUNTRY") {
      if (!data.parentType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["parentType"],
          message: "Parent type is required",
        })
      }
      if (!data.parentUuid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["parentUuid"],
          message: "Parent is required",
        })
      }
      if (data.parentType && data.type) {
        const childIdx = GEOGRAPHY_HIERARCHY.indexOf(
          data.type as (typeof GEOGRAPHY_HIERARCHY)[number]
        )
        const parentIdx = GEOGRAPHY_HIERARCHY.indexOf(
          data.parentType as (typeof GEOGRAPHY_HIERARCHY)[number]
        )
        if (parentIdx !== -1 && childIdx !== -1 && parentIdx >= childIdx) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["parentType"],
            message: "Parent type must be higher than selected type",
          })
        }
      }
    }
  })

type GeoFormValues = z.infer<typeof geoSchema>

type GeographyFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  /** When set, the dialog edits that geography; otherwise it creates one */
  geographyUuid?: string | null
}

function toFormDefaults(): GeoFormValues {
  return {
    code: "",
    name: "",
    type: undefined as unknown as GeoFormValues["type"],
    parentType: undefined,
    parentUuid: undefined,
    description: "",
  }
}

export function GeographyFormDialog({
  open,
  onOpenChange,
  companyUuid,
  geographyUuid,
}: GeographyFormDialogProps) {
  const isEdit = !!geographyUuid
  const { data: geography, isLoading: isDetailLoading } = useGeography(
    companyUuid,
    geographyUuid ?? ""
  )
  const createMutation = useCreateGeography(companyUuid)
  const updateMutation = useUpdateGeography(companyUuid)
  const [parentOpen, setParentOpen] = useState(false)

  const {
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<GeoFormValues>({
    resolver: zodResolver(geoSchema),
    defaultValues: toFormDefaults(),
  })

  const typeValue = useWatch({ control, name: "type" })
  const parentTypeValue = useWatch({ control, name: "parentType" })
  const parentUuidValue = useWatch({ control, name: "parentUuid" })

  const allowedParentTypes = useMemo(() => {
    if (!typeValue || typeValue === "COUNTRY") return [] as GeographyType[]
    const idx = GEOGRAPHY_HIERARCHY.indexOf(
      typeValue as (typeof GEOGRAPHY_HIERARCHY)[number]
    )
    if (idx <= 0) return [] as GeographyType[]
    return GEOGRAPHY_HIERARCHY.slice(0, idx) as unknown as GeographyType[]
  }, [typeValue])

  const needsParent = !!typeValue && typeValue !== "COUNTRY"

  // Prefill when the dialog opens (create defaults, or edit detail)
  useEffect(() => {
    if (!open) return
    if (isEdit) {
      if (geography) {
        reset({
          code: geography.code,
          name: geography.name,
          type: geography.type,
          parentType: geography.parentType ?? undefined,
          parentUuid: geography.parentUuid ?? undefined,
          description: geography.description ?? "",
        })
      }
    } else {
      reset(toFormDefaults())
    }
  }, [open, isEdit, geography, reset])

  // Clear parent fields when type changes to COUNTRY or parentType becomes invalid
  useEffect(() => {
    if (!typeValue || typeValue === "COUNTRY") {
      setValue("parentType", undefined, { shouldValidate: true })
      setValue("parentUuid", undefined, { shouldValidate: true })
      return
    }
    if (
      parentTypeValue &&
      !allowedParentTypes.includes(parentTypeValue as GeographyType)
    ) {
      setValue("parentType", undefined, { shouldValidate: true })
      setValue("parentUuid", undefined, { shouldValidate: true })
    }
  }, [typeValue, allowedParentTypes, parentTypeValue, setValue])

  // Clear the selected parent when the parent type itself changes
  // (FormSelectField has no per-change side-effect hook). Skips the initial
  // undefined -> value transition so edit-mode prefills are preserved.
  const prevParentTypeRef = React.useRef<typeof parentTypeValue>(undefined)
  useEffect(() => {
    if (
      prevParentTypeRef.current !== undefined &&
      prevParentTypeRef.current !== parentTypeValue
    ) {
      setValue("parentUuid", undefined, { shouldValidate: true })
    }
    prevParentTypeRef.current = parentTypeValue
  }, [parentTypeValue, setValue])

  const { data: parentOptionsData, isLoading: parentOptionsLoading } =
    useGeographies(
      companyUuid,
      {
        type: parentTypeValue as GeographyType,
        size: 100,
        status: "ACTIVE" as const,
      },
      { enabled: open && !!parentTypeValue && !!companyUuid && needsParent }
    )
  // A geography cannot be its own parent — exclude self in edit mode
  const parentOptions = useMemo(
    () =>
      (parentOptionsData?.content ?? []).filter(
        (g) => g.geographyUuid !== geographyUuid
      ),
    [parentOptionsData, geographyUuid]
  )
  const selectedParent = useMemo(
    () =>
      parentOptions.find((g) => g.geographyUuid === parentUuidValue) ?? null,
    [parentOptions, parentUuidValue]
  )

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      reset()
      setParentOpen(false)
    }
    onOpenChange(next)
  }

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    (isEdit && isDetailLoading)

  const onSubmit = (values: GeoFormValues) => {
    if (isEdit) {
      if (!geographyUuid) return
      // Backend PUT accepts only name, parentUuid, description
      // (code and type are immutable)
      updateMutation.mutate(
        {
          geographyUuid,
          input: {
            name: values.name,
            parentUuid:
              values.type === "COUNTRY" ? undefined : values.parentUuid,
            description: values.description || undefined,
          },
        },
        {
          onSuccess: () => {
            toast.success("Geography updated")
            handleOpenChange(false)
          },
          onError: (error) => {
            toast.error(getApiErrorMessage(error, "Failed"))
          },
        }
      )
      return
    }
    createMutation.mutate(
      {
        code: values.code,
        name: values.name,
        type: values.type,
        description: values.description || undefined,
        ...(values.parentUuid ? { parentUuid: values.parentUuid } : {}),
      },
      {
        onSuccess: () => {
          toast.success("Geography created")
          reset(toFormDefaults())
          handleOpenChange(false)
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error, "Failed"))
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Geography" : "Create Geography"}
          </DialogTitle>
        </DialogHeader>
        {isEdit && isDetailLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FieldGroup>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <FormTextField
                  control={control}
                  name="code"
                  label="Code"
                  placeholder="Enter code"
                  disabled={isEdit}
                />
                <FormTextField
                  control={control}
                  name="name"
                  label="Name"
                  placeholder="Enter name"
                />
                <div>
                  <FormSelectField
                    control={control}
                    name="type"
                    label="Type"
                    placeholder="Select type"
                    disabled={isEdit}
                    options={GEOGRAPHY_TYPE_OPTIONS}
                  />
                  {isEdit && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Type cannot be changed after creation.
                    </p>
                  )}
                </div>
                {needsParent && (
                  <FormSelectField
                    control={control}
                    name="parentType"
                    label="Parent Type"
                    placeholder="Select parent type"
                    options={allowedParentTypes.map((pt) => ({
                      value: pt,
                      label: pt.charAt(0) + pt.slice(1).toLowerCase(),
                    }))}
                  />
                )}
                {needsParent && parentTypeValue && (
                  <Field className="lg:col-span-2">
                    <FieldLabel>
                      Parent (
                      {parentTypeValue.charAt(0) +
                        parentTypeValue.slice(1).toLowerCase()}
                      )
                    </FieldLabel>
                    <Popover open={parentOpen} onOpenChange={setParentOpen}>
                      <PopoverTrigger
                        render={
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={parentOpen}
                            aria-invalid={!!errors.parentUuid}
                            disabled={
                              !parentTypeValue || parentOptionsLoading
                            }
                            className={cn(
                              "w-full justify-between font-normal",
                              !selectedParent && "text-muted-foreground",
                              !!errors.parentUuid &&
                                // Ring removed in favor of border feedback: ring-destructive/20
                                "border-destructive"
                            )}
                          />
                        }
                      >
                        {selectedParent
                          ? `${selectedParent.name} (${selectedParent.code})`
                          : parentOptionsLoading
                            ? "Loading..."
                            : `Select ${parentTypeValue.toLowerCase()}`}
                        <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-[--anchor-width] p-0"
                        align="start"
                      >
                        <Command>
                          <CommandInput
                            placeholder={`Search ${parentTypeValue.toLowerCase()}...`}
                          />
                          <CommandList>
                            <CommandEmpty>
                              No {parentTypeValue.toLowerCase()} found
                            </CommandEmpty>
                            <CommandGroup>
                              {parentOptions.map((g) => {
                                const label = `${g.name} (${g.code})`
                                return (
                                  <CommandItem
                                    key={g.geographyUuid}
                                    value={label}
                                    onSelect={() => {
                                      setValue("parentUuid", g.geographyUuid, {
                                        shouldValidate: true,
                                      })
                                      setParentOpen(false)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 size-4",
                                        parentUuidValue === g.geographyUuid
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {label}
                                  </CommandItem>
                                )
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FieldError errors={[errors.parentUuid]} />
                  </Field>
                )}
                <FormTextareaField
                  control={control}
                  name="description"
                  label="Description"
                  placeholder="Enter description"
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
                {isPending
                  ? isEdit
                    ? "Saving..."
                    : "Creating..."
                  : isEdit
                    ? "Save changes"
                    : "Create"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
