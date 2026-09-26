import { describe, expect, it } from "vitest"
import { deriveTheme, themeToCssVars } from "./theme-utils"
import { toHex } from "./color-utils"

/**
 * Regression test: default/preset themes store colors as oklch() strings.
 * Customizing any single color (e.g. Primary) drops the preset exact-match
 * and runs the derived path — derivation must handle oklch inputs so no
 * other surface (sidebar, topbar, …) changes as a side effect.
 */
const whiteChromeWithCustomPrimary = {
  topbar: { background: "oklch(1 0 0)" },
  sidebar: { background: "oklch(1 0 0)" },
  primary: { color: "#e11d48" },
  charts: {
    chart1: "#e11d48",
    chart2: "#e11d48",
    chart3: "#e11d48",
    chart4: "#e11d48",
    chart5: "#e11d48",
  },
}

describe("oklch theme values", () => {
  it("converts oklch() to the expected sRGB hex", () => {
    expect(toHex("oklch(1 0 0)")).toBe("#ffffff")
    expect(toHex("oklch(0 0 0)")).toBe("#000000")
    expect(toHex("#e11d48")).toBe("#e11d48")
  })

  it("derives a dark sidebar foreground on a white sidebar", () => {
    const d = deriveTheme(whiteChromeWithCustomPrimary)
    expect(d.sidebarBackground).toBe("oklch(1 0 0)")
    expect(d.sidebarForeground).toBe("#1f1f1f")
    expect(d.sidebarHover).toBe("#ededed")
    expect(d.topbarForeground).toBe("#1f1f1f")
  })

  it("only the primary vars follow the custom primary color", () => {
    const vars = themeToCssVars(whiteChromeWithCustomPrimary)
    expect(vars["--primary"]).toBe("#e11d48")
    expect(vars["--sidebar"]).toBe("oklch(1 0 0)")
    expect(vars["--sidebar-foreground"]).toBe("#1f1f1f")
    expect(vars["--sidebar-hover"]).toBe("#ededed")
  })
})
