"use client"

import { MASTER_DATA_TYPES } from "../api/master-data-upload.api"
import type { MasterDataType } from "../api/master-data-upload.types"
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

type MasterTypeOption = { type: MasterDataType; label: string }

const OPTIONS: MasterTypeOption[] = MASTER_DATA_TYPES.map((t) => ({
  type: t.type,
  label: t.label,
}))

type Props = {
  value: MasterDataType
  onValueChange: (type: MasterDataType) => void
  disabled?: boolean
  placeholder?: string
}

export function MasterTypeCombobox({
  value,
  onValueChange,
  disabled,
  placeholder = "Select master data type...",
}: Props) {
  const selected = OPTIONS.find((o) => o.type === value) ?? OPTIONS[0]

  return (
    <Combobox
      items={OPTIONS}
      value={selected}
      disabled={disabled}
      onValueChange={(next: MasterTypeOption | null) => {
        if (next) onValueChange(next.type)
      }}
      itemToStringLabel={(item: MasterTypeOption | null) => item?.label ?? ""}
    >
      <ComboboxTrigger
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-full justify-between gap-2 px-3 font-normal"
        )}
      >
        <span className="min-w-0 flex-1 truncate text-left">
          <ComboboxValue placeholder={placeholder} />
        </span>
      </ComboboxTrigger>
      <ComboboxContent>
        <ComboboxInput
          placeholder="Search master data types..."
          disabled={disabled}
          showTrigger={false}
          showSearchIcon
          className="has-[[data-slot=input-group-control]:focus-visible]:ring-0"
        />
        <ComboboxEmpty>No master data types found.</ComboboxEmpty>
        <ComboboxList>
          {(item: MasterTypeOption) => (
            <ComboboxItem key={item.type} value={item}>
              <span className="font-medium">{item.label}</span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
