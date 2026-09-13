import { z } from "zod"
import type { DepartmentStatus } from "../api/department.types"

export const DEPARTMENT_PAGE_SIZE = 20

export const DEPARTMENT_CODE_PATTERN = /^[A-Za-z0-9_-]{1,50}$/
export const DEPARTMENT_CODE_PATTERN_MESSAGE = "Invalid code format"

export const DEPARTMENT_STATUS_OPTIONS: {
  value: DepartmentStatus
  label: string
}[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
]

export const DEPARTMENT_DEFAULT_CREATE_VALUES = {
  code: "",
  name: "",
  status: "ACTIVE" as DepartmentStatus,
}

export const departmentSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(50)
    .regex(DEPARTMENT_CODE_PATTERN, DEPARTMENT_CODE_PATTERN_MESSAGE),
  name: z.string().min(1, "Name is required"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
})

export type DepartmentFormValues = z.infer<typeof departmentSchema>

export const DEPARTMENT_TEXTS = {
  title: "Departments",
  description: "Manage company departments",
  searchPlaceholder: "Search departments...",
  emptyTitle: "No departments found",
  emptyCreateHint: "Create a department to get started.",
  emptySearchHint: "Try a different search.",
  createTitle: "Create Department",
  editTitle: "Edit Department",
  createAction: "Create",
  saveAction: "Save",
} as const
