"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Spinner } from "@/components/ui/spinner"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { useDepartment } from "../hooks/use-department"
import { useCreateDepartment } from "../hooks/use-create-department"
import { useUpdateDepartment } from "../hooks/use-update-department"
import type { DepartmentStatus } from "../api/department.types"
import {
  DEPARTMENT_STATUS_OPTIONS,
  DEPARTMENT_TEXTS,
  departmentSchema,
  type DepartmentFormValues,
} from "../configs/department.config"
import {
  toCreateInput,
  toFormDefaults,
  toUpdateInput,
} from "../utils/department.utils"

type DepartmentFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  /** When set, the dialog edits that department; otherwise it creates one */
  departmentUuid?: string | null
}

export function DepartmentFormDialog({
  open,
  onOpenChange,
  companyUuid,
  departmentUuid,
}: DepartmentFormDialogProps) {
  const isEdit = !!departmentUuid
  const { data: department, isLoading: isDetailLoading } = useDepartment(
    companyUuid,
    departmentUuid ?? ""
  )
  const createMutation = useCreateDepartment(companyUuid)
  const updateMutation = useUpdateDepartment(companyUuid)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: toFormDefaults(),
  })
  const statusValue = useWatch({ control, name: "status" })

  React.useEffect(() => {
    if (!open) return
    if (isEdit) {
      if (department) reset(toFormDefaults(department))
    } else {
      reset(toFormDefaults())
    }
  }, [open, isEdit, department, reset])

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    (isEdit && isDetailLoading)

  const onSubmit = (values: DepartmentFormValues) => {
    if (isEdit) {
      if (!departmentUuid || !department) return
      updateMutation.mutate(
        {
          uuid: departmentUuid,
          input: toUpdateInput(values, department.version),
        },
        {
          onSuccess: () => {
            toast.success("Department updated")
            onOpenChange(false)
          },
          onError: (error) => {
            toast.error(getApiErrorMessage(error, "Failed"))
          },
        }
      )
      return
    }
    createMutation.mutate(toCreateInput(values), {
      onSuccess: () => {
        toast.success("Department created")
        reset(toFormDefaults())
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, "Failed"))
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? DEPARTMENT_TEXTS.editTitle : DEPARTMENT_TEXTS.createTitle}
          </DialogTitle>
        </DialogHeader>
        {isEdit && isDetailLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Code</FieldLabel>
                <Input
                  placeholder="e.g. SALES"
                  aria-invalid={!!errors.code}
                  {...register("code")}
                  autoComplete="off"
                />
                <FieldError errors={[errors.code]} />
              </Field>
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input
                  placeholder="e.g. Sales"
                  aria-invalid={!!errors.name}
                  {...register("name")}
                  autoComplete="off"
                />
                <FieldError errors={[errors.name]} />
              </Field>
              <Field>
                <FieldLabel>Status</FieldLabel>
                <Select
                  value={statusValue ?? ""}
                  onValueChange={(v: string | null) =>
                    v &&
                    setValue("status", v as DepartmentStatus, {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger aria-invalid={!!errors.status}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENT_STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[errors.status]} />
              </Field>
            </FieldGroup>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? isEdit
                    ? "Saving..."
                    : "Creating..."
                  : isEdit
                    ? DEPARTMENT_TEXTS.saveAction
                    : DEPARTMENT_TEXTS.createAction}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
