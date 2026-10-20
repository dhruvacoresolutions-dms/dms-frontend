"use client"

import * as React from "react"
import {
  EntityCombobox,
  type ComboboxOption,
} from "@/components/common/EntityCombobox"
import { useCustomerTypes } from "../hooks/use-customer-types"
import type { CustomerType } from "../api/customer.types"

type Props = {
  companyUuid: string
  value?: string | null
  onValueChange: (value: string | null, item?: CustomerType | null) => void
  disabled?: boolean
  placeholder?: string
}

const toOption = (type: CustomerType): ComboboxOption => ({
  id: type.uuid,
  label: type.name,
  sub: type.code,
})

/** Global customer types (`RETAILER`, `MECHANIC`). */
export function CustomerTypeCombobox({
  companyUuid,
  value,
  onValueChange,
  disabled,
  placeholder = "Select customer type...",
}: Props) {
  const { data, isFetching } = useCustomerTypes(companyUuid)
  const types = React.useMemo(() => data ?? [], [data])

  const options = React.useMemo(() => types.map(toOption), [types])
  const selected = React.useMemo(() => {
    const match = types.find((t) => t.uuid === value)
    return match ? toOption(match) : null
  }, [types, value])

  return (
    <EntityCombobox
      companyUuid={companyUuid}
      value={value}
      onValueChange={(nextId) => {
        if (!nextId) {
          onValueChange(null, null)
          return
        }
        onValueChange(
          nextId,
          types.find((t) => t.uuid === nextId) ?? null
        )
      }}
      disabled={disabled}
      options={options}
      selectedOption={selected}
      loading={isFetching}
      emptyText="No customer types found."
      clearLabel="Clear customer type"
      placeholder={placeholder}
      searchPlaceholder="Search customer types..."
    />
  )
}
