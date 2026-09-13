"use client"

import * as React from "react"
import { X } from "lucide-react"
import { useRoles } from "../hooks/use-roles"
import type { RoleListItem } from "../api/role.types"
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
  onValueChange: (value: string | null, role?: RoleListItem | null) => void
  placeholder?: string
  disabled?: boolean
  /** Only list roles with this status */
  status?: RoleListItem["status"]
}

function roleId(r: RoleListItem): string {
  return r.roleUuid
}

/**
 * Role picker backed by the full roles List API with client-side search
 * filtering (roles are unpaginated, so the whole list is always present).
 */
export function RoleCombobox({
  companyUuid,
  value,
  onValueChange,
  placeholder = "Search role...",
  disabled,
  status,
}: Props) {
  const [inputValue, setInputValue] = React.useState("")

  const rolesQuery = useRoles(companyUuid, status ? { status } : undefined)
  // BE varies between `roleUuid` and legacy `publicId` — normalize so keys
  // and the emitted value are always a stable unique id (same approach as
  // the designations normalize step).
  const allRoles = React.useMemo<RoleListItem[]>(
    () =>
      (rolesQuery.data ?? []).map((r) => ({
        ...r,
        roleUuid:
          r.roleUuid ??
          (r as unknown as { publicId?: string }).publicId ??
          r.code,
      })),
    [rolesQuery.data]
  )

  const selectedItem: RoleListItem | null = React.useMemo(() => {
    if (!value) return null
    return allRoles.find((r) => roleId(r) === value) ?? null
  }, [allRoles, value])

  const isFetching = rolesQuery.isFetching

  const clearSelection = () => {
    onValueChange(null)
    setInputValue("")
  }

  const stopToggle = (e: React.SyntheticEvent) => {
    e.stopPropagation()
    e.preventDefault()
  }

  return (
    <Combobox
      items={allRoles}
      value={selectedItem}
      disabled={disabled}
      inputValue={inputValue}
      onInputValueChange={(nextValue, details) => {
        if (details.reason === "item-press") return
        setInputValue(nextValue)
      }}
      onValueChange={(next: RoleListItem | null) => {
        onValueChange(next ? roleId(next) : null, next)
        setInputValue("")
      }}
      itemToStringLabel={(item: RoleListItem | null) => item?.name ?? ""}
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
            aria-label="Clear role"
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
          placeholder="Search roles..."
          disabled={disabled}
          showTrigger={false}
          showSearchIcon
          className="has-[[data-slot=input-group-control]:focus-visible]:ring-0"
        />
        {isFetching ? (
          <div className="flex justify-center px-3 py-2 text-sm text-muted-foreground">
            Loading…
          </div>
        ) : null}
        {!isFetching ? <ComboboxEmpty>No roles found.</ComboboxEmpty> : null}
        <ComboboxList>
          {(item: RoleListItem) => (
            <ComboboxItem key={roleId(item)} value={item}>
              <span className="flex flex-col">
                <span className="font-medium">{item.name}</span>
                <span className="text-xs text-muted-foreground">
                  {item.code}
                </span>
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
