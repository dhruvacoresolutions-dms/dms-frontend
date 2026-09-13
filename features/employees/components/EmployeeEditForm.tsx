"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/common/PhoneInput"
import { DatePicker } from "@/components/common/DatePicker"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LoadingState } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { useEmployee } from "../hooks/use-employee"
import { useUpdateEmployee } from "../hooks/use-update-employee"
import { useDesignations } from "@/features/designations/hooks/use-designations"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { DesignationCombobox } from "@/features/designations/components/DesignationCombobox"
import { DepartmentCombobox } from "@/features/departments/components/DepartmentCombobox"
import { EmployeeCombobox } from "./EmployeeCombobox"
import {
  EMPLOYEE_STATUS_OPTIONS,
  EMPLOYEE_TYPE_OPTIONS,
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
} from "./EmployeeCreateForm"

const employeeSchema = z.object({
  employeeCode: z.string().min(1, "Code is required").max(50),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  mobile: z
    .string()
    .min(1, "Mobile is required")
    .regex(/^[6-9]\d{9}$/, "Enter valid 10-digit Indian mobile (starts 6-9)"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  designationUuid: z.string().optional(),
  departmentUuid: z.string().optional(),
  reportsToEmployeeUuid: z.string().optional(),
  dateOfJoining: z.string().min(1, "Date of joining is required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"], {
    message: "Gender is required",
  }),
  dateOfBirth: z.string().optional(),
  employeeType: z.enum(["PERMANENT", "CONTRACT", "TEMPORARY"], {
    message: "Employee type is required",
  }),
  status: z.enum(["ACTIVE", "INACTIVE"], { message: "Status is required" }),
  maritalStatus: z
    .enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"])
    .optional(),
  anniversaryDate: z.string().optional().nullable(),
})

export type EmployeeEditFormValues = z.infer<typeof employeeSchema>

type Props = {
  companyUuid: string
  employeeUuid: string
  /** Where to navigate after successful update */
  redirectTo: string
}

export function EmployeeEditForm({
  companyUuid,
  employeeUuid,
  redirectTo,
}: Props) {
  const router = useRouter()
  const { data: employee, isLoading, error, refetch } = useEmployee(
    companyUuid,
    employeeUuid
  )
  const updateMutation = useUpdateEmployee(companyUuid, employeeUuid)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EmployeeEditFormValues>({
    resolver: zodResolver(employeeSchema),
  })

  React.useEffect(() => {
    if (employee) {
      reset({
        employeeCode: employee.employeeCode ?? "",
        firstName: employee.firstName ?? "",
        lastName: employee.lastName ?? "",
        mobile: employee.mobile ?? "",
        email: employee.email ?? "",
        designationUuid: employee.designationUuid ?? undefined,
        departmentUuid: employee.departmentUuid ?? undefined,
        reportsToEmployeeUuid: employee.reportsToEmployeeUuid ?? undefined,
        dateOfJoining: employee.dateOfJoining ?? "",
        gender: (employee.gender ?? undefined) as
          | EmployeeEditFormValues["gender"]
          | undefined,
        dateOfBirth: employee.dateOfBirth ?? "",
        employeeType: (employee.employeeType ?? undefined) as
          | EmployeeEditFormValues["employeeType"]
          | undefined,
        status: employee.status ?? "ACTIVE",
        maritalStatus: employee.maritalStatus ?? undefined,
        anniversaryDate: employee.anniversaryDate ?? null,
      })
    }
  }, [employee, reset])

  const selectedDesignationUuid = useWatch({ control, name: "designationUuid" })
  const mobileValue = useWatch({ control, name: "mobile" })

  // ── Reporting-manager eligibility ──────────────────────────────
  // Lower hierarchyLevel number = higher position. Only employees holding a
  // designation senior to the selected one can be a reporting manager.
  const designationsQuery = useDesignations(companyUuid, {
    page: 0,
    size: 100,
  })
  const allDesignations = React.useMemo(
    () => designationsQuery.data?.content ?? [],
    [designationsQuery.data]
  )
  const selectedHierarchyLevel = React.useMemo(() => {
    if (!selectedDesignationUuid) return null
    return (
      allDesignations.find(
        (d) => (d.designationUuid ?? d.publicId) === selectedDesignationUuid
      )?.hierarchyLevel ?? null
    )
  }, [allDesignations, selectedDesignationUuid])
  const seniorDesignationUuids = React.useMemo(() => {
    if (selectedHierarchyLevel === null) return undefined
    return allDesignations
      .filter((d) => d.hierarchyLevel < selectedHierarchyLevel)
      .map((d) => d.designationUuid ?? d.publicId)
  }, [allDesignations, selectedHierarchyLevel])

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState onRetry={refetch} />
  if (!employee) return <ErrorState message="Employee not found" />

  return (
    <form
      className="max-w-2xl space-y-6"
      onSubmit={handleSubmit((values) => {
        const payload = {
          employeeCode: values.employeeCode,
          firstName: values.firstName,
          lastName: values.lastName,
          mobile: values.mobile,
          email: values.email,
          designationUuid: values.designationUuid || undefined,
          departmentUuid: values.departmentUuid || undefined,
          reportsToEmployeeUuid: values.reportsToEmployeeUuid || null,
          dateOfJoining: values.dateOfJoining || undefined,
          gender: values.gender,
          dateOfBirth: values.dateOfBirth || undefined,
          employeeType: values.employeeType,
          status: values.status,
          maritalStatus: values.maritalStatus || undefined,
          anniversaryDate: values.anniversaryDate || null,
        }
        updateMutation.mutate(payload, {
          onSuccess: () => {
            toast.success("Employee updated")
            router.push(redirectTo)
          },
          onError: (error) => {
            toast.error(getApiErrorMessage(error, "Failed to update employee"))
          },
        })
      })}
    >
      <div className="rounded-lg border p-6 space-y-4">
        <FieldGroup>
          <Field>
            <FieldLabel>Employee Code</FieldLabel>
            <Input
              placeholder="e.g. NEW001"
              aria-invalid={!!errors.employeeCode}
              {...register("employeeCode")}
            />
            <FieldError errors={[errors.employeeCode]} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>First Name</FieldLabel>
              <Input
                placeholder="First name"
                aria-invalid={!!errors.firstName}
                {...register("firstName")}
              />
              <FieldError errors={[errors.firstName]} />
            </Field>
            <Field>
              <FieldLabel>Last Name</FieldLabel>
              <Input
                placeholder="Last name"
                aria-invalid={!!errors.lastName}
                {...register("lastName")}
              />
              <FieldError errors={[errors.lastName]} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Mobile</FieldLabel>
              <PhoneInput
                value={mobileValue ?? ""}
                onValueChange={(v) =>
                  setValue("mobile", v, {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true,
                  })
                }
                hasError={!!errors.mobile}
                placeholder="98765 43210"
              />
              <FieldError errors={[errors.mobile]} />
            </Field>
            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input
                type="email"
                placeholder="e.g. emp@company.com"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              <FieldError errors={[errors.email]} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Gender</FieldLabel>
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(v) => v && field.onChange(v)}
                  >
                    <SelectTrigger
                      className="w-full"
                      aria-invalid={!!errors.gender}
                    >
                      <SelectValue placeholder="Select gender">
                        {field.value
                          ? GENDER_OPTIONS.find((o) => o.value === field.value)
                              ?.label
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.gender]} />
            </Field>
            <Field>
              <FieldLabel>Employee Type</FieldLabel>
              <Controller
                control={control}
                name="employeeType"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(v) => v && field.onChange(v)}
                  >
                    <SelectTrigger
                      className="w-full"
                      aria-invalid={!!errors.employeeType}
                    >
                      <SelectValue placeholder="Select type">
                        {field.value
                          ? EMPLOYEE_TYPE_OPTIONS.find(
                              (o) => o.value === field.value
                            )?.label
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYEE_TYPE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.employeeType]} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Designation</FieldLabel>
              <Controller
                control={control}
                name="designationUuid"
                render={({ field }) => (
                  <DesignationCombobox
                    companyUuid={companyUuid}
                    value={field.value ?? null}
                    onValueChange={(v) => {
                      field.onChange(v ?? undefined)
                      // Previously picked manager may no longer be senior to
                      // the new designation, so reset the Reports To field.
                      setValue("reportsToEmployeeUuid", undefined)
                    }}
                    placeholder="Search designation..."
                    size={100}
                  />
                )}
              />
              <FieldError errors={[errors.designationUuid]} />
            </Field>
            <Field>
              <FieldLabel>Department</FieldLabel>
              <Controller
                control={control}
                name="departmentUuid"
                render={({ field }) => (
                  <DepartmentCombobox
                    companyUuid={companyUuid}
                    value={field.value ?? null}
                    onValueChange={(v) => field.onChange(v ?? undefined)}
                    placeholder="Search department..."
                    size={100}
                  />
                )}
              />
              <FieldError errors={[errors.departmentUuid]} />
            </Field>
          </div>

          <Field>
            <FieldLabel>Reports To</FieldLabel>
            <Controller
              control={control}
              name="reportsToEmployeeUuid"
              render={({ field }) => (
                <EmployeeCombobox
                  companyUuid={companyUuid}
                  value={field.value ?? null}
                  onValueChange={(v) => field.onChange(v ?? undefined)}
                  placeholder={
                    selectedDesignationUuid
                      ? "Search reporting manager..."
                      : "Select a designation first..."
                  }
                  disabled={!selectedDesignationUuid}
                  size={100}
                  excludeUuid={employeeUuid}
                  allowedDesignationUuids={seniorDesignationUuids}
                  emptyMessage={
                    seniorDesignationUuids?.length === 0
                      ? "No senior designation exists above the selected one."
                      : "No senior employees found for this designation."
                  }
                />
              )}
            />
            <FieldError errors={[errors.reportsToEmployeeUuid]} />
            {!selectedDesignationUuid ? (
              <p className="text-xs text-muted-foreground">
                Select a designation to see eligible managers holding a senior
                designation.
              </p>
            ) : null}
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Date of Joining</FieldLabel>
              <Controller
                control={control}
                name="dateOfJoining"
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? null}
                    onValueChange={(v) => field.onChange(v ?? "")}
                    placeholder="Pick joining date"
                    hasError={!!errors.dateOfJoining}
                  />
                )}
              />
              <FieldError errors={[errors.dateOfJoining]} />
            </Field>
            <Field>
              <FieldLabel>Date of Birth</FieldLabel>
              <Controller
                control={control}
                name="dateOfBirth"
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? null}
                    onValueChange={(v) => field.onChange(v ?? "")}
                    placeholder="Pick birth date"
                    disableFuture
                    hasError={!!errors.dateOfBirth}
                  />
                )}
              />
              <FieldError errors={[errors.dateOfBirth]} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select
                    value={field.value ?? "ACTIVE"}
                    onValueChange={(v) => v && field.onChange(v)}
                  >
                    <SelectTrigger
                      className="w-full"
                      aria-invalid={!!errors.status}
                    >
                      <SelectValue placeholder="Select status">
                        {field.value
                          ? EMPLOYEE_STATUS_OPTIONS.find(
                              (o) => o.value === field.value
                            )?.label
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYEE_STATUS_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.status]} />
            </Field>
            <Field>
              <FieldLabel>Marital Status</FieldLabel>
              <Controller
                control={control}
                name="maritalStatus"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(v) => v && field.onChange(v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select marital status">
                        {field.value
                          ? MARITAL_STATUS_OPTIONS.find(
                              (o) => o.value === field.value
                            )?.label
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {MARITAL_STATUS_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.maritalStatus]} />
            </Field>
          </div>

          <Field>
            <FieldLabel>Anniversary Date</FieldLabel>
            <Controller
              control={control}
              name="anniversaryDate"
              render={({ field }) => (
                <DatePicker
                  value={field.value ?? null}
                  onValueChange={(v) => field.onChange(v ?? null)}
                  placeholder="Pick anniversary date"
                  disableFuture
                  hasError={!!errors.anniversaryDate}
                />
              )}
            />
            <FieldError errors={[errors.anniversaryDate]} />
          </Field>
        </FieldGroup>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
