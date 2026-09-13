import { DEPARTMENT_DEFAULT_CREATE_VALUES } from "../configs/department.config"
import type {
  CreateDepartmentRequest,
  DepartmentResponse,
  UpdateDepartmentRequest,
} from "../api/department.types"
import type { DepartmentFormValues } from "../configs/department.config"

export function toFormDefaults(
  department?: DepartmentResponse | null
): DepartmentFormValues {
  if (!department) return { ...DEPARTMENT_DEFAULT_CREATE_VALUES }
  return {
    code: department.code,
    name: department.name,
    status: department.status,
  }
}

export function toCreateInput(
  values: DepartmentFormValues
): CreateDepartmentRequest {
  return {
    code: values.code,
    name: values.name,
    status: values.status,
  }
}

export function toUpdateInput(
  values: DepartmentFormValues,
  version: number
): UpdateDepartmentRequest {
  return {
    code: values.code,
    name: values.name,
    status: values.status,
    version,
  }
}
