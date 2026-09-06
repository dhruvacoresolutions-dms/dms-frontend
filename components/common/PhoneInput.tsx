"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { normalizeIndianMobile, toE164IndianMobile } from "@/lib/utils/phone"

type PhoneInputProps = {
  id?: string
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  placeholder?: string
  disabled?: boolean
  hasError?: boolean
  autoComplete?: string
  className?: string
}

export function PhoneInput({
  id,
  value,
  defaultValue,
  onValueChange,
  onBlur,
  placeholder = "98765 43210",
  disabled,
  hasError,
  autoComplete = "tel",
  className,
}: PhoneInputProps) {
  const isControlled = value !== undefined

  const [internal, setInternal] = React.useState(() =>
    normalizeIndianMobile(defaultValue ?? "")
  )

  const displayValue = isControlled
    ? normalizeIndianMobile(value ?? "")
    : internal

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    // keep only digits, max 10
    const normalized = normalizeIndianMobile(raw).slice(0, 10)
    // allow intermediate typing: don't block if first digit <6 yet, let validation handle
    if (!isControlled) setInternal(normalized)
    onValueChange?.(normalized)
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text")
    const normalized = normalizeIndianMobile(pasted).slice(0, 10)
    if (normalized !== pasted.replace(/\D/g, "").slice(0, 10)) {
      e.preventDefault()
      if (!isControlled) setInternal(normalized)
      onValueChange?.(normalized)
    }
  }

  return (
    <InputGroup
      className={cn(
        hasError && "border-destructive ring-destructive/20 has-[[data-slot][aria-invalid=true]]:border-destructive",
        className
      )}
      data-invalid={hasError ? "true" : undefined}
    >
      <InputGroupAddon align="inline-start" className="pl-2.5 pr-1.5">
        <InputGroupText className="font-medium tracking-tight text-foreground">
          +91
        </InputGroupText>
      </InputGroupAddon>
      <InputGroupInput
        id={id}
        type="tel"
        inputMode="numeric"
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        onPaste={handlePaste}
        onBlur={onBlur}
        disabled={disabled}
        autoComplete={autoComplete}
        maxLength={10}
        aria-invalid={!!hasError}
        className="font-mono tracking-wide"
      />
    </InputGroup>
  )
}

// Re-export helper for BE payload
export { toE164IndianMobile, normalizeIndianMobile }
