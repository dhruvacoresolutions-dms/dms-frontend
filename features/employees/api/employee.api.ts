import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import type {
  EmployeeResponse,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  UpdateEmployeeStatusRequest,
  EmployeeListParams,
  EmployeeGeographyResponse,
  AssignEmployeeGeographyRequest,
} from "./employee.types"
import type { PageResponse } from "@/features/companies/api/company.types"

const baseUrl = (companyUuid: string) =>
  `/v1/companies/${companyUuid}/employees`

export async function getEmployees(
  companyUuid: string,
  params?: EmployeeListParams
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<EmployeeResponse>>
  >(baseUrl(companyUuid), {
    params,
    headers: { "X-Company-Context": companyUuid },
  })
  return data.data
}

export async function getEmployee(companyUuid: string, employeeUuid: string) {
  const { data } = await apiClient.get<ApiSuccessResponse<EmployeeResponse>>(
    `${baseUrl(companyUuid)}/${employeeUuid}`,
    { headers: { "X-Company-Context": companyUuid } }
  )
  return data.data
}

export async function createEmployee(
  companyUuid: string,
  input: CreateEmployeeRequest
) {
  const { data } = await apiClient.post<ApiSuccessResponse<EmployeeResponse>>(
    baseUrl(companyUuid),
    input,
    { headers: { "X-Company-Context": companyUuid } }
  )
  return data.data
}

export async function updateEmployee(
  companyUuid: string,
  employeeUuid: string,
  input: UpdateEmployeeRequest
) {
  const { data } = await apiClient.put<ApiSuccessResponse<EmployeeResponse>>(
    `${baseUrl(companyUuid)}/${employeeUuid}`,
    input,
    { headers: { "X-Company-Context": companyUuid } }
  )
  return data.data
}

export async function updateEmployeeStatus(
  companyUuid: string,
  employeeUuid: string,
  input: UpdateEmployeeStatusRequest
) {
  const { data } = await apiClient.patch<ApiSuccessResponse<EmployeeResponse>>(
    `${baseUrl(companyUuid)}/${employeeUuid}/status`,
    input,
    { headers: { "X-Company-Context": companyUuid } }
  )
  return data.data
}

export async function getEmployeeGeographies(
  companyUuid: string,
  employeeUuid: string
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<EmployeeGeographyResponse[]>
  >(`${baseUrl(companyUuid)}/${employeeUuid}/geographies`, {
    headers: { "X-Company-Context": companyUuid },
  })
  return data.data
}

export async function assignEmployeeGeography(
  companyUuid: string,
  employeeUuid: string,
  input: AssignEmployeeGeographyRequest
) {
  const { data } = await apiClient.post<
    ApiSuccessResponse<EmployeeGeographyResponse[]>
  >(`${baseUrl(companyUuid)}/${employeeUuid}/geographies`, input, {
    headers: { "X-Company-Context": companyUuid },
  })
  return data.data
}

export async function removeEmployeeGeography(
  companyUuid: string,
  employeeUuid: string,
  geographyUuid: string
) {
  const { data } = await apiClient.delete<
    ApiSuccessResponse<EmployeeGeographyResponse[]>
  >(`${baseUrl(companyUuid)}/${employeeUuid}/geographies/${geographyUuid}`, {
    headers: { "X-Company-Context": companyUuid },
  })
  return data.data
}
