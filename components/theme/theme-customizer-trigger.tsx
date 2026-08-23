"use client"

import { useState } from "react"
import { Paintbrush } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ThemeCustomizer } from "@/components/theme/theme-customizer"

export function ThemeCustomizerTrigger({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="ghost" size="icon" className={className} onClick={() => setOpen(true)} aria-label="Customize theme">
        <Paintbrush className="size-4" />
      </Button>
      <ThemeCustomizer open={open} onOpenChange={setOpen} />
    </>
  )
}
