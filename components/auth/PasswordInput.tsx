"use client"

import { useState } from "react"
import { Eye, EyeOff, Check, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { passwordRequirements } from "@/lib/validations/password"

type PasswordInputProps = React.ComponentProps<typeof Input> & {
  /** Show live validation checklist below the input */
  showRequirements?: boolean
}

export function PasswordInput({
  className,
  showRequirements = false,
  onChange,
  value,
  defaultValue,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  const [internalValue, setInternalValue] = useState(
    () => (typeof defaultValue === "string" ? defaultValue : "")
  )

  const currentValue =
    typeof value === "string" ? value : internalValue

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (value === undefined) {
      setInternalValue(e.target.value)
    }
    onChange?.(e)
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="relative">
        <Input
          type={visible ? "text" : "password"}
          className="pr-9"
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute inset-y-0 right-1 my-auto text-muted-foreground hover:bg-transparent"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((current) => !current)}
          tabIndex={-1}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
      </div>
      {showRequirements && (
        <ul className="grid gap-1 rounded-md border bg-muted/30 p-2.5 shadow-xs">
          {passwordRequirements.map((req) => {
            const passed = req.test(currentValue ?? "")
            return (
              <li
                key={req.label}
                className={cn(
                  "flex items-center gap-1.5 text-xs",
                  passed ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                )}
              >
                {passed ? (
                  <Check className="size-3.5 shrink-0" />
                ) : (
                  <X className="size-3.5 shrink-0 opacity-60" />
                )}
                {req.label}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/**
 * Standalone checklist component for cases where you want to render
 * requirements outside the input (e.g. beside the form).
 */
export function PasswordRequirements({ value }: { value: string }) {
  return (
    <ul className="grid gap-1 rounded-md border bg-muted/30 p-2.5 shadow-xs">
      {passwordRequirements.map((req) => {
        const passed = req.test(value)
        return (
          <li
            key={req.label}
            className={cn(
              "flex items-center gap-1.5 text-xs",
              passed ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
            )}
          >
            {passed ? <Check className="size-3.5 shrink-0" /> : <X className="size-3.5 shrink-0 opacity-60" />}
            {req.label}
          </li>
        )
      })}
    </ul>
  )
}
