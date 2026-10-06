"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { FieldGroup } from "@/components/ui/field"
import {
  FormComboboxField,
  FormDateField,
  FormPhoneField,
  FormSelectField,
  FormTextField,
} from "@/components/common/form-fields"
import { useCreateEmployee } from "../hooks/use-create-employee"
import { useDesignations } from "@/features/designations/hooks/use-designations"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { DesignationCombobox } from "@/features/designations/components/DesignationCombobox"
import { DepartmentCombobox } from "@/features/departments/components/DepartmentCombobox"
import { EmployeeCombobox } from "./EmployeeCombobox"

export const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
] as const

export const EMPLOYEE_TYPE_OPTIONS = [
  { value: "PERMANENT", label: "Permanent" },
  { value: "CONTRACT", label: "Contract" },
  { value: "TEMPORARY", label: "Temporary" },
] as const

export const EMPLOYEE_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
] as const

export const MARITAL_STATUS_OPTIONS = [
  { value: "SINGLE", label: "Single" },
  { value: "MARRIED", label: "Married" },
  { value: "DIVORCED", label: "Divorced" },
  { value: "WIDOWED", label: "Widowed" },
] as const

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

export type EmployeeCreateFormValues = z.infer<typeof employeeSchema>

type Props = {
  companyUuid: string
  /** Where to navigate after successful creation */
  redirectTo: string
}

export function EmployeeCreateForm({ companyUuid, redirectTo }: Props) {
  const router = useRouter()
  const createMutation = useCreateEmployee(companyUuid)

  const { handleSubmit, control, setValue } =
    useForm<EmployeeCreateFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employeeCode: "",
      firstName: "",
      lastName: "",
      mobile: "",
      email: "",
      designationUuid: undefined,
      departmentUuid: undefined,
      reportsToEmployeeUuid: undefined,
      dateOfJoining: "",
      gender: undefined as unknown as EmployeeCreateFormValues["gender"],
      dateOfBirth: "",
      employeeType:
        undefined as unknown as EmployeeCreateFormValues["employeeType"],
      status: "ACTIVE",
      maritalStatus: undefined,
      anniversaryDate: null,
    },
  })

  // ── Reporting-manager eligibility ──────────────────────────────
  // Lower hierarchyLevel number = higher position. Only employees holding a
  // designation senior to the selected one can be a reporting manager.
  const selectedDesignationUuid = useWatch({ control, name: "designationUuid" })

  // Previously picked manager may no longer be senior to the new designation,
  // so reset Reports To when the designation changes. Skips the initial
  // undefined -> value transition so edit-mode prefills are preserved.
  const prevDesignationRef = React.useRef<string | undefined>(undefined)
  React.useEffect(() => {
    if (
      prevDesignationRef.current !== undefined &&
      prevDesignationRef.current !== selectedDesignationUuid
    ) {
      setValue("reportsToEmployeeUuid", undefined)
    }
    prevDesignationRef.current = selectedDesignationUuid
  }, [selectedDesignationUuid, setValue])
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
          reportsToEmployeeUuid: values.reportsToEmployeeUuid || undefined,
          dateOfJoining: values.dateOfJoining || undefined,
          gender: values.gender,
          dateOfBirth: values.dateOfBirth || undefined,
          employeeType: values.employeeType,
          status: values.status,
          maritalStatus: values.maritalStatus || undefined,
          anniversaryDate: values.anniversaryDate || null,
        }
        createMutation.mutate(payload, {
          onSuccess: () => {
            toast.success("Employee created")
            router.push(redirectTo)
          },
          onError: (error) => {
            toast.error(getApiErrorMessage(error, "Failed to create employee"))
          },
        })
      })}
    >
      <div className="rounded-lg border p-6 space-y-4">
        <FieldGroup>
          <FormTextField
            control={control}
            name="employeeCode"
            label="Employee Code"
            placeholder="Enter employee code"
          />

          <div className="grid grid-cols-2 gap-4">
            <FormTextField
              control={control}
              name="firstName"
              label="First Name"
              placeholder="Enter first name"
            />
            <FormTextField
              control={control}
              name="lastName"
              label="Last Name"
              placeholder="Enter last name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormPhoneField
              control={control}
              name="mobile"
              label="Mobile"
              placeholder="Enter mobile number"
            />
            <FormTextField
              control={control}
              name="email"
              label="Email"
              type="email"
              placeholder="Enter email"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormSelectField
              control={control}
              name="gender"
              label="Gender"
              placeholder="Select gender"
              options={GENDER_OPTIONS}
            />
            <FormSelectField
              control={control}
              name="employeeType"
              label="Employee Type"
              placeholder="Select employee type"
              options={EMPLOYEE_TYPE_OPTIONS}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormComboboxField
              control={control}
              name="designationUuid"
              label="Designation"
              companyUuid={companyUuid}
              Combobox={DesignationCombobox}
              placeholder="Select designation"
              comboboxProps={{ size: 100 }}
            />
            <FormComboboxField
              control={control}
              name="departmentUuid"
              label="Department"
              companyUuid={companyUuid}
              Combobox={DepartmentCombobox}
              placeholder="Select department"
              comboboxProps={{ size: 100 }}
            />
          </div>

          <FormComboboxField
            control={control}
            name="reportsToEmployeeUuid"
            label="Reports To"
            companyUuid={companyUuid}
            Combobox={EmployeeCombobox}
            placeholder={
              selectedDesignationUuid
                ? "Select reporting manager"
                : "Select a designation first"
            }
            disabled={!selectedDesignationUuid}
            comboboxProps={{
              size: 100,
              allowedDesignationUuids: seniorDesignationUuids,
              emptyMessage:
                seniorDesignationUuids?.length === 0
                  ? "No senior designation exists above the selected one."
                  : "No senior employees found for this designation.",
            }}
          />
          {!selectedDesignationUuid ? (
            <p className="text-xs text-muted-foreground">
              Select a designation to see eligible managers holding a senior
              designation.
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <FormDateField
              control={control}
              name="dateOfJoining"
              label="Date of Joining"
              placeholder="Pick a date"
            />
            <FormDateField
              control={control}
              name="dateOfBirth"
              label="Date of Birth"
              placeholder="Pick a date"
              disableFuture
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormSelectField
              control={control}
              name="status"
              label="Status"
              placeholder="Select status"
              options={EMPLOYEE_STATUS_OPTIONS}
            />
            <FormSelectField
              control={control}
              name="maritalStatus"
              label="Marital Status"
              placeholder="Select marital status"
              options={MARITAL_STATUS_OPTIONS}
            />
          </div>

          <FormDateField
            control={control}
            name="anniversaryDate"
            label="Anniversary Date"
            placeholder="Pick a date"
            disableFuture
          />
        </FieldGroup>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Creating..." : "Create Employee"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
