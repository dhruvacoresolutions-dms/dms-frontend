"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { X } from "lucide-react"
import { useEmployees } from "../hooks/use-employees"
import { getEmployee } from "../api/employee.api"
import type { EmployeeResponse } from "../api/employee.types"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox"

type Props = {
  companyUuid: string
  value?: string | null
  onValueChange: (
    value: string | null,
    employee?: EmployeeResponse | null
  ) => void
  placeholder?: string
  disabled?: boolean
  /** Page size for the options query */
  size?: number
  /** Exclude this employee uuid from options (e.g. self) */
  excludeUuid?: string | null
  /**
   * When provided, only employees whose `designationUuid` is in this set are
   * listed. Used to restrict "Reports To" to senior designations
   * (lower hierarchyLevel number = higher position).
   * `undefined` = no filtering.
   */
  allowedDesignationUuids?: string[] | null
  /** Message shown when the filtered list is empty */
  emptyMessage?: string
}

function employeeUuidOf(e: EmployeeResponse): string {
  return e.employeeUuid ?? (e as unknown as { publicId: string }).publicId ?? ""
}

function employeeLabel(e: EmployeeResponse): string {
  return `${e.firstName} ${e.lastName}`.trim()
}

export function EmployeeCombobox({
  companyUuid,
  value,
  onValueChange,
  placeholder = "Search employee...",
  disabled,
  size = 100,
  excludeUuid,
  allowedDesignationUuids,
  emptyMessage,
}: Props) {
  const [inputValue, setInputValue] = React.useState("")

  const [debouncedQuery, setDebouncedQuery] = React.useState("")
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(inputValue.trim()), 300)
    return () => clearTimeout(t)
  }, [inputValue])

  const employeesQuery = useEmployees(companyUuid, {
    search: debouncedQuery || undefined,
    page: 0,
    size,
  })

  const rawResults = employeesQuery.data?.content ?? []
  const allowedSet = React.useMemo(
    () =>
      allowedDesignationUuids === undefined
        ? null
        : new Set(allowedDesignationUuids ?? []),
    [allowedDesignationUuids]
  )
  const searchResults = React.useMemo(() => {
    let results = excludeUuid
      ? rawResults.filter((e) => employeeUuidOf(e) !== excludeUuid)
      : rawResults
    // Restrict to senior designations when a filter set is provided.
    // Employees without a designation can't be verified as senior, so they
    // are excluded from the filtered list.
    if (allowedSet) {
      results = results.filter(
        (e) => e.designationUuid && allowedSet.has(e.designationUuid)
      )
    }
    return results
  }, [rawResults, excludeUuid, allowedSet])

  const selectedInResults = React.useMemo(
    () => searchResults.find((e) => employeeUuidOf(e) === value),
    [searchResults, value]
  )

  const { data: fetchedSelected } = useQuery({
    queryKey: ["companies", companyUuid, "employees", "detail", value],
    queryFn: () => getEmployee(companyUuid, value as string),
    enabled: !!value && !selectedInResults && !!companyUuid,
  })

  const selectedItem: EmployeeResponse | null = React.useMemo(() => {
    if (!value) return null
    if (selectedInResults) return selectedInResults
    if (fetchedSelected) return fetchedSelected
    return null
  }, [value, selectedInResults, fetchedSelected])

  const items = React.useMemo(() => {
    if (!selectedItem) return searchResults
    if (
      searchResults.some(
        (e) => employeeUuidOf(e) === employeeUuidOf(selectedItem)
      )
    )
      return searchResults
    return [...searchResults, selectedItem]
  }, [searchResults, selectedItem])

  const isFetching = employeesQuery.isFetching

  const clearSelection = () => {
    onValueChange(null)
    setInputValue("")
    setDebouncedQuery("")
  }

  const stopToggle = (e: React.SyntheticEvent) => {
    e.stopPropagation()
    e.preventDefault()
  }

  return (
    <Combobox
      items={items}
      value={selectedItem}
      disabled={disabled}
      inputValue={inputValue}
      onInputValueChange={(nextValue, details) => {
        if (details.reason === "item-press") return
        setInputValue(nextValue)
      }}
      onValueChange={(next: EmployeeResponse | null) => {
        const uuid = next ? employeeUuidOf(next) : null
        onValueChange(uuid, next)
        setInputValue("")
        setDebouncedQuery("")
      }}
      itemToStringLabel={(item: EmployeeResponse | null) =>
        item ? employeeLabel(item) : ""
      }
      filter={null}
    >
      <ComboboxTrigger
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-full justify-between gap-2 px-3 font-normal"
        )}
      >
        <span
          className={
            selectedItem
              ? "min-w-0 flex-1 truncate text-left"
              : "min-w-0 flex-1 truncate text-left text-muted-foreground"
          }
        >
          <ComboboxValue placeholder={placeholder} />
        </span>
        {selectedItem && !disabled && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Clear reporting manager"
            onClick={(e) => {
              stopToggle(e)
              clearSelection()
            }}
            onMouseDown={stopToggle}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                stopToggle(e)
                clearSelection()
              }
            }}
            className="flex size-4 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </span>
        )}
      </ComboboxTrigger>
      <ComboboxContent>
        <ComboboxInput
          placeholder="Search employees..."
          disabled={disabled}
          showTrigger={false}
          showSearchIcon
          className="has-[[data-slot=input-group-control]:focus-visible]:ring-0"
        />
        {isFetching ? (
          <div className="flex justify-center px-3 py-2 text-sm text-muted-foreground">
            Searching…
          </div>
        ) : null}
        {!isFetching ? (
          <ComboboxEmpty>
            {emptyMessage ?? "No employees found."}
          </ComboboxEmpty>
        ) : null}
        <ComboboxList>
          {(item: EmployeeResponse) => (
            <ComboboxItem key={employeeUuidOf(item)} value={item}>
              <span className="flex flex-col">
                <span className="font-medium">{employeeLabel(item)}</span>
                <span className="text-xs text-muted-foreground">
                  {item.designationName
                    ? `${item.designationName} • ${item.employeeCode}`
                    : item.employeeCode}
                </span>
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
