"use client"

import { BarChart3, Home, Settings } from "lucide-react"

import { useTheme as useNextTheme } from "next-themes"

import type { ThemeConfig } from "@/lib/theme/types"
import { deriveTheme, getAdjustedTheme } from "@/lib/theme/theme-utils"

const bars = [62, 88, 45, 74, 96]

export function ThemePreview({ config }: { config: ThemeConfig }) {
  const { resolvedTheme } = useNextTheme()
  const isDarkMode = resolvedTheme === "dark"
  const effective = getAdjustedTheme(config, isDarkMode)
  const d = deriveTheme(effective)

  return (
    <div className="overflow-hidden rounded-lg border shadow-sm">
      <div
        className="flex h-9 items-center justify-between px-3 text-xs font-medium"
        style={{
          backgroundColor: d.topbarBackground,
          color: d.topbarForeground,
          borderBottom: `1px solid ${d.topbarBorder}`,
        }}
      >
        <span>Topbar</span>
        <span
          className="rounded-full px-2 py-0.5 text-[10px]"
          style={{ backgroundColor: d.accent, color: d.accentForeground }}
        >
          Accent
        </span>
      </div>

      <div className="flex h-[168px]">
        <div
          className="w-28 shrink-0 space-y-1 p-2 text-[11px]"
          style={{
            backgroundColor: d.sidebarBackground,
            color: d.sidebarForeground,
            borderRight: `1px solid ${d.sidebarBorder}`,
          }}
        >
          <div
            className="flex items-center gap-1.5 rounded px-2 py-1.5"
            style={{
              backgroundColor: d.sidebarActive,
              color: d.sidebarActiveForeground,
            }}
          >
            <Home className="size-3" /> Dashboard
          </div>
          <div
            className="flex items-center gap-1.5 rounded px-2 py-1.5"
            style={{
              backgroundColor: d.sidebarHover,
              color: d.sidebarHoverForeground,
            }}
          >
            <BarChart3 className="size-3" /> Reports
          </div>
          <div
            className="flex items-center gap-1.5 rounded px-2 py-1.5"
            style={{ color: d.sidebarMutedForeground }}
          >
            <Settings className="size-3" /> Settings
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between bg-background p-3">
          <div className="flex h-16 items-end gap-2">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t"
                style={{ height: `${h}%`, backgroundColor: d.charts[i] }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md px-3 py-1.5 text-xs font-medium"
              style={{ backgroundColor: d.primary, color: d.primaryForeground }}
            >
              Primary
            </button>
            <span
              className="rounded-md px-3 py-1.5 text-xs"
              style={{ backgroundColor: d.accent, color: d.accentForeground }}
            >
              Accent
            </span>
            <span
              className="size-6 rounded-md ring-2"
              style={{
                backgroundColor: "transparent",
                boxShadow: `0 0 0 2px ${d.ring}`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
