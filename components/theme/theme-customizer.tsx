"use client"

import { useEffect, useState } from "react"
import { Paintbrush, RotateCcw } from "lucide-react"
import { useTheme as useNextTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ColorSetting } from "@/components/theme/color-setting"
import { useDynamicTheme } from "@/components/theme/dynamic-theme-provider"
import { THEME_PRESETS } from "@/lib/theme/default-theme"
import type { ThemeConfig } from "@/lib/theme/types"
import {
  useNavigationStore,
  type NavigationLayout,
} from "@/stores/navigation-store"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import { ThemePreview } from "./theme-preview"

export function ThemeCustomizer({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { theme, defaultTheme, previewTheme, applyTheme, resetTheme } =
    useDynamicTheme()
  const { theme: mode, setTheme: setMode } = useNextTheme()
  const layout = useNavigationStore((s) => s.layout)
  const setLayout = useNavigationStore((s) => s.setLayout)
  const [snapshot, setSnapshot] = useState<ThemeConfig>(theme)
  const [modeSnapshot, setModeSnapshot] = useState<string | undefined>(mode)
  const [layoutSnapshot, setLayoutSnapshot] = useState<NavigationLayout>(layout)

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSnapshot(theme)
      setModeSnapshot(mode)
      setLayoutSnapshot(layout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const set = (patch: (prev: ThemeConfig) => ThemeConfig) => previewTheme(patch)

  const cancel = () => {
    previewTheme(snapshot)
    if (modeSnapshot) setMode(modeSnapshot)
    setLayout(layoutSnapshot)
    onOpenChange(false)
  }

  const currentPreset =
    THEME_PRESETS.find((p) => JSON.stringify(p.theme) === JSON.stringify(theme))
      ?.id ?? ""

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) cancel()
        else onOpenChange(true)
      }}
    >
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b">
          <SheetTitle className="flex items-center gap-2">
            <Paintbrush className="size-4" /> Theme Customizer
          </SheetTitle>
          <SheetDescription>
            Pick a few key colors — everything else is derived automatically.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          <ThemePreview config={theme} />

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Appearance</h3>
            <Select
              value={mode ?? undefined}
              onValueChange={(v) => {
                if (v) setMode(v)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Light / Dark / System mode
            </p>
          </section>

          <Separator />

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Navigation</h3>
            <RadioGroup
              value={layout}
              onValueChange={(v) => setLayout(v as NavigationLayout)}
              className="grid grid-cols-2 gap-2"
            >
              <Label
                htmlFor="nav-sidebar"
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/10",
                  layout === "sidebar"
                    ? "border-primary bg-primary/10"
                    : "border-input bg-background hover:bg-muted"
                )}
              >
                <RadioGroupItem value="sidebar" id="nav-sidebar" />
                Sidebar
              </Label>
              <Label
                htmlFor="nav-topnav"
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/10",
                  layout === "topnav"
                    ? "border-primary bg-primary/10"
                    : "border-input bg-background hover:bg-muted"
                )}
              >
                <RadioGroupItem value="topnav" id="nav-topnav" />
                Top Navbar
              </Label>
            </RadioGroup>
            <p className="text-xs text-muted-foreground">Choose navigation layout</p>
          </section>

          <Separator />

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Presets</h3>
            <Select
              value={currentPreset}
              onValueChange={(id) => {
                const preset = THEME_PRESETS.find((p) => p.id === id)
                if (preset) previewTheme(preset.theme)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a preset" />
              </SelectTrigger>
              <SelectContent>
                {THEME_PRESETS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="size-3 rounded-full"
                        style={{ backgroundColor: p.theme.primary.color }}
                      />
                      {p.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>

          <Separator />

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Topbar</h3>
            <ColorSetting
              label="Topbar Color"
              description="Text contrast is handled for you"
              value={theme.topbar.background}
              onChange={(hex) =>
                set((p) => ({ ...p, topbar: { background: hex } }))
              }
            />
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Sidebar</h3>
            <ColorSetting
              label="Sidebar Color"
              description="Text, hover and active states derived"
              value={theme.sidebar.background}
              onChange={(hex) =>
                set((p) => ({ ...p, sidebar: { background: hex } }))
              }
            />
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Primary</h3>
            <ColorSetting
              label="Primary Button Color"
              description="Hover, accent and ring derived"
              value={theme.primary.color}
              onChange={(hex) =>
                set((p) => ({ ...p, primary: { color: hex } }))
              }
            />
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Charts</h3>
            {(["chart1", "chart2", "chart3", "chart4", "chart5"] as const).map(
              (key, i) => (
                <ColorSetting
                  key={key}
                  label={`Chart Color ${i + 1}`}
                  value={theme.charts[key]}
                  onChange={(hex) =>
                    set((p) => ({ ...p, charts: { ...p.charts, [key]: hex } }))
                  }
                />
              )
            )}
          </section>
        </div>

        <div className="sticky bottom-0 flex items-center gap-2 border-t bg-background p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => previewTheme(defaultTheme)}
            className="gap-1.5"
          >
            <RotateCcw className="size-4" /> Reset
          </Button>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={cancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => {
              if (JSON.stringify(theme) === JSON.stringify(defaultTheme))
                resetTheme()
              else applyTheme()
              onOpenChange(false)
            }}
          >
            Apply
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
