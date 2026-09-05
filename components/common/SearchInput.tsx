"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X } from "lucide-react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"

type SearchInputProps = {
  placeholder?: string
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  debounceMs?: number
  className?: string
  autoFocus?: boolean
}

export function SearchInput({
  placeholder = "Search...",
  value,
  defaultValue = "",
  onChange,
  debounceMs = 300,
  className,
  autoFocus,
}: SearchInputProps) {
  const initial = value ?? defaultValue
  const [innerValue, setInnerValue] = useState<string>(initial)
  const isFirstRender = useRef(true)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const debouncedValue = useDebounce(innerValue, debounceMs)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    onChangeRef.current?.(debouncedValue)
  }, [debouncedValue])

  return (
    <InputGroup className={cn("max-w-sm flex-1", className)}>
      <InputGroupInput
        placeholder={placeholder}
        value={innerValue}
        onChange={(e) => setInnerValue(e.target.value)}
        autoFocus={autoFocus}
      />
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      {innerValue && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            variant="ghost"
            aria-label="Clear search"
            onClick={() => {
              setInnerValue("")
              // immediate clear, bypass debounce for better UX
              onChange?.("")
            }}
          >
            <X />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}
