"use client"

import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { isValidHex, normalizeHex } from "@/lib/theme/color-utils"

export interface ColorSettingProps {
  label: string
  value: string
  onChange: (hex: string) => void
  description?: string
  className?: string
}

export function ColorSetting({ label, value, onChange, description, className }: ColorSettingProps) {
  const [draft, setDraft] = useState(value)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    // sync external value to draft
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(value)
    setInvalid(false)
  }, [value])

  const commit = (next: string) => {
    setDraft(next)
    if (isValidHex(next)) {
      setInvalid(false)
      onChange(normalizeHex(next))
    } else {
      setInvalid(true)
    }
  }

  const id = `color-${label.toLowerCase().replace(/\s+/g, "-")}`

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <label
        htmlFor={`${id}-picker`}
        className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-md border shadow-sm"
      >
        <span className="block size-full" style={{ backgroundColor: value }} />
        <input
          id={`${id}-picker`}
          type="color"
          value={isValidHex(value) ? normalizeHex(value) : "#000000"}
          onChange={(e) => commit(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label={`${label} color picker`}
        />
      </label>

      <div className="min-w-0 flex-1">
        <Label htmlFor={id} className="text-sm">
          {label}
        </Label>
        {description ? <p className="truncate text-xs text-muted-foreground">{description}</p> : null}
      </div>

      <div className="shrink-0">
        <input
          id={id}
          value={draft}
          spellCheck={false}
          onChange={(e) => commit(e.target.value)}
          onBlur={() => {
            if (!isValidHex(draft)) {
              setDraft(value)
              setInvalid(false)
            }
          }}
          className={cn(
            "w-24 rounded-md border bg-background px-2 py-1.5 text-right font-mono text-xs uppercase outline-none focus:ring-2 focus:ring-ring",
            invalid && "border-destructive text-destructive"
          )}
          aria-invalid={invalid}
        />
        {invalid ? <p className="mt-1 text-right text-[10px] text-destructive">Invalid HEX</p> : null}
      </div>
    </div>
  )
}
