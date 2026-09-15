import type { QueryClient } from "@tanstack/react-query"
import { employeeKeys } from "../api/employee-keys"
import type { EmployeeResponse } from "../api/employee.types"
import type { PageResponse } from "@/features/companies/api/company.types"

/**
 * Instantly patch a single employee inside every cached employees list
 * (all pages/filters), so the table reflects an update without waiting
 * for the background refetch. Callers must still invalidate the list
 * queries so the server remains the source of truth.
 */
export function patchEmployeeInLists(
  queryClient: QueryClient,
  companyUuid: string,
  employeeUuid: string,
  patch: Partial<EmployeeResponse>
) {
  queryClient.setQueriesData<PageResponse<EmployeeResponse>>(
    { queryKey: employeeKeys.lists(companyUuid), exact: false },
    (old) => {
      if (!old || !Array.isArray(old.content)) return old
      return {
        ...old,
        content: old.content.map((emp) =>
          (emp.employeeUuid ?? emp.publicId) === employeeUuid
            ? { ...emp, ...patch }
            : emp
        ),
      }
    }
  )
}
