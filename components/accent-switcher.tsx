"use client"

import { CheckIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { ACCENT_OPTIONS, getAccentOption } from "@/lib/accents"
import { useAccentStore } from "@/stores/accent-store"

export function AccentSwitcher({ className }: { className?: string }) {
  const accent = useAccentStore((state) => state.accent)
  const setAccent = useAccentStore((state) => state.setAccent)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className={cn("size-8", className)}
            aria-label="Change accent color"
          />
        }
      >
        <span
          className="size-4 rounded-full ring-1 ring-foreground/20 ring-inset"
          style={{ backgroundColor: getAccentOption(accent).swatch }}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-auto min-w-44 rounded-lg p-2"
        align="end"
        sideOffset={8}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-1 pt-0.5 pb-1.5 text-xs">
            Accent color
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <div className="grid grid-cols-7 gap-1.5">
          {ACCENT_OPTIONS.map((option) => {
            const isActive = accent === option.id
            return (
              <button
                key={option.id}
                type="button"
                title={option.label}
                aria-label={option.label}
                aria-pressed={isActive}
                onClick={() => setAccent(option.id)}
                className={cn(
                  "flex size-7 cursor-pointer items-center justify-center rounded-full transition-transform outline-none hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring",
                  isActive &&
                    "ring-2 ring-foreground ring-offset-2 ring-offset-popover"
                )}
                style={{ backgroundColor: option.swatch }}
              >
                {isActive ? (
                  <CheckIcon className="size-3.5 text-white" />
                ) : null}
              </button>
            )
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
