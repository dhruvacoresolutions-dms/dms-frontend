"use client"

import * as React from "react"
import { X } from "lucide-react"
import { usePermissionSets } from "../hooks/use-permission-sets"
import type { PermissionSetListItem } from "../api/permission-set.types"
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
    permissionSet?: PermissionSetListItem | null
  ) => void
  placeholder?: string
  disabled?: boolean
  /** Only list permission sets with this status */
  status?: PermissionSetListItem["status"]
}

function permissionSetId(ps: PermissionSetListItem): string {
  return ps.permissionSetUuid
}

/**
 * Permission-set picker backed by the full List API with client-side search
 * filtering (permission sets are unpaginated, so the whole list is present).
 */
export function PermissionSetCombobox({
  companyUuid,
  value,
  onValueChange,
  placeholder = "Search permission set...",
  disabled,
  status,
}: Props) {
  const [inputValue, setInputValue] = React.useState("")

  const permissionSetsQuery = usePermissionSets(
    companyUuid,
    status ? { status } : undefined
  )
  // BE varies between `permissionSetUuid` and legacy `publicId` — normalize
  // so keys and the emitted value are always a stable unique id.
  const allSets = React.useMemo<PermissionSetListItem[]>(
    () =>
      (permissionSetsQuery.data ?? []).map((ps) => ({
        ...ps,
        permissionSetUuid:
          ps.permissionSetUuid ??
          (ps as unknown as { publicId?: string }).publicId ??
          ps.code,
      })),
    [permissionSetsQuery.data]
  )

  const selectedItem: PermissionSetListItem | null = React.useMemo(() => {
    if (!value) return null
    return allSets.find((ps) => permissionSetId(ps) === value) ?? null
  }, [allSets, value])

  const isFetching = permissionSetsQuery.isFetching

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
      items={allSets}
      value={selectedItem}
      disabled={disabled}
      inputValue={inputValue}
      onInputValueChange={(nextValue, details) => {
        if (details.reason === "item-press") return
        setInputValue(nextValue)
      }}
      onValueChange={(next: PermissionSetListItem | null) => {
        onValueChange(next ? permissionSetId(next) : null, next)
        setInputValue("")
      }}
      itemToStringLabel={(item: PermissionSetListItem | null) => item?.name ?? ""}
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
            aria-label="Clear permission set"
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
          placeholder="Search permission sets..."
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
        {!isFetching ? (
          <ComboboxEmpty>No permission sets found.</ComboboxEmpty>
        ) : null}
        <ComboboxList>
          {(item: PermissionSetListItem) => (
            <ComboboxItem key={permissionSetId(item)} value={item}>
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
